/**
 * Exercises the API routes in-process against a throwaway in-memory database, using
 * Firebase-style ID tokens signed with a local test key. Gemini, ImgBB and Stripe are left
 * unconfigured, so nothing leaves this machine; those calls must report "not configured".
 *
 *   npm run test:api
 */

import assert from "node:assert/strict";

import type { NextRequest as NextRequestType } from "next/server";

type RouteModule = Record<
  string,
  (req: NextRequestType, ctx: { params: Record<string, string> }) => Promise<Response>
>;

async function main() {
  process.env.PGLITE_DIR = "memory://";
  process.env.FIREBASE_PROJECT_ID = "test-project";
  for (const key of ["DATABASE_URL", "GEMINI_API_KEY", "IMGBB_API_KEY", "STRIPE_SECRET_KEY", "VERCEL"]) {
    delete process.env[key];
  }

  const { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } = await import("jose");
  const { NextRequest } = await import("next/server");
  const { default: sharp } = await import("sharp");
  const { eq } = await import("drizzle-orm");
  const auth = await import("../src/server/auth");
  const { getDb } = await import("../src/server/db");
  const { medicalImages, users } = await import("../src/server/db/schema");
  const { claimRateLimit } = await import("../src/server/rateLimit");
  const { stripImageMetadata } = await import("../src/server/imgbb");

  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256" };
  auth.setFirebaseKeySetForTesting(createLocalJWKSet({ keys: [jwk] }));

  const signToken = (uid: string, email: string, overrides: { audience?: string; email_verified?: boolean } = {}) =>
    new SignJWT({ email, email_verified: overrides.email_verified ?? true, auth_time: Math.floor(Date.now() / 1000), name: uid })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://securetoken.google.com/test-project")
      .setAudience(overrides.audience ?? "test-project")
      .setSubject(uid)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

  const asRoute = (mod: unknown) => mod as RouteModule;
  const routes = {
    health: asRoute(await import("../src/app/api/health/route")),
    register: asRoute(await import("../src/app/api/auth/supporter-register/route")),
    me: asRoute(await import("../src/app/api/auth/me/route")),
    config: asRoute(await import("../src/app/api/supporter/config/route")),
    checkout: asRoute(await import("../src/app/api/supporter/create-checkout-session/route")),
    images: asRoute(await import("../src/app/api/images/route")),
    image: asRoute(await import("../src/app/api/images/[imageId]/route")),
    imageAnnotations: asRoute(await import("../src/app/api/images/[imageId]/annotations/route")),
    annotation: asRoute(await import("../src/app/api/annotations/[annotationId]/route")),
    comments: asRoute(await import("../src/app/api/images/[imageId]/comments/route")),
    ask: asRoute(await import("../src/app/api/ai/ask/route")),
    search: asRoute(await import("../src/app/api/search/route")),
  };

  async function call(
    mod: RouteModule,
    method: string,
    path: string,
    opts: { token?: string; body?: unknown; form?: FormData; params?: Record<string, string> } = {},
  ) {
    const headers = new Headers();
    if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);
    let body: BodyInit | undefined;
    if (opts.form) body = opts.form;
    else if (opts.body !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(opts.body);
    }
    const req = new NextRequest(new URL(path, "http://localhost:3000"), { method, headers, body });
    const res = await mod[method](req, { params: opts.params ?? {} });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  let passed = 0;
  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  ok  ${name}`);
    } catch (err) {
      console.error(`  FAIL ${name}`);
      throw err;
    }
  }

  const alice = await signToken("uid-alice", "alice@example.com");
  const bob = await signToken("uid-bob", "bob@example.com");
  const db = await getDb();
  const PRIVATE_FIELDS = ["email", "phone_number", "address", "supporter_comments"];

  console.log("Auth");
  await check("health responds", async () => {
    assert.equal((await call(routes.health, "GET", "/api/health")).status, 200);
  });
  await check("no token -> 401", async () => {
    assert.equal((await call(routes.me, "GET", "/api/auth/me")).status, 401);
  });
  await check("garbage token -> 401", async () => {
    assert.equal((await call(routes.me, "GET", "/api/auth/me", { token: "not-a-jwt" })).status, 401);
  });
  await check("token for another Firebase project -> 401", async () => {
    const token = await signToken("uid-x", "x@example.com", { audience: "other-project" });
    assert.equal((await call(routes.me, "GET", "/api/auth/me", { token })).status, 401);
  });
  await check("unverified email -> 403", async () => {
    const token = await signToken("uid-y", "y@example.com", { email_verified: false });
    assert.equal((await call(routes.me, "GET", "/api/auth/me", { token })).status, 403);
  });
  await check("register takes identity from the token, not the body", async () => {
    const res = await call(routes.register, "POST", "/api/auth/supporter-register", {
      token: alice,
      body: {
        email: "victim@example.com",
        role: "admin",
        firebase_uid: "uid-victim",
        full_name: "Alice <b>Nguyen</b>",
        profession: "Nurse",
        phone_number: "+61 412 345 678",
        supporter_comments: "Hello",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.email, "alice@example.com");
    assert.equal(res.body.firebase_uid, "uid-alice");
    assert.equal(res.body.role, "supporter");
    assert.equal(res.body.full_name, "Alice Nguyen");
    assert.equal(res.body.phone_number, "+61412345678");
    assert.equal(res.body.supporter_comments, "Hello");
    assert.equal(res.body.app_tag, "healthlms");
  });
  await check("invalid phone number -> 422", async () => {
    const res = await call(routes.me, "PUT", "/api/auth/me", { token: alice, body: { phone_number: "call me" } });
    assert.equal(res.status, 422);
  });
  await check("profile update keeps unspecified fields and clears empty ones", async () => {
    const res = await call(routes.me, "PUT", "/api/auth/me", { token: alice, body: { address: "", profession: "Midwife" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.profession, "Midwife");
    assert.equal(res.body.address, null);
    assert.equal(res.body.phone_number, "+61412345678");
  });
  await check("same verified email on a new sign-in links to the existing account", async () => {
    const first = await call(routes.me, "GET", "/api/auth/me", { token: alice });
    const relinked = await call(routes.me, "GET", "/api/auth/me", {
      token: await signToken("uid-alice-2", "Alice@Example.com"),
    });
    assert.equal(relinked.body.id, first.body.id);
    assert.equal(relinked.body.firebase_uid, "uid-alice-2");
  });

  const aliceNow = await signToken("uid-alice-2", "alice@example.com");
  await call(routes.me, "GET", "/api/auth/me", { token: bob });
  await db.update(users).set({ role: "doctor" }).where(eq(users.email, "bob@example.com"));
  const [bobUser] = await db.select().from(users).where(eq(users.email, "bob@example.com"));

  console.log("Images");
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#808080" } }).png().toBuffer();
  const uploadForm = () => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "scan.png");
    form.append("title", "Right wrist X-ray");
    form.append("modality", "XRAY");
    form.append("body_region", "Wrist");
    form.append("is_anonymized", "true");
    return form;
  };
  await check("supporters can't upload", async () => {
    const res = await call(routes.images, "POST", "/api/images", { token: aliceNow, form: uploadForm() });
    assert.equal(res.status, 403);
  });
  await check("doctor upload reports ImgBB not configured", async () => {
    const res = await call(routes.images, "POST", "/api/images", { token: bob, form: uploadForm() });
    assert.equal(res.status, 503);
    assert.match(res.body.detail, /IMGBB_API_KEY/);
  });
  await check("non-image upload -> 400", async () => {
    const form = uploadForm();
    form.set("file", new Blob(["hello"], { type: "image/png" }), "fake.png");
    assert.equal((await call(routes.images, "POST", "/api/images", { token: bob, form })).status, 400);
  });
  await check("EXIF metadata is removed before upload", async () => {
    const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#808080" } })
      .jpeg()
      .withExifMerge({ IFD0: { Copyright: "Patient: Jane Citizen" } })
      .toBuffer();
    assert.ok((await sharp(jpeg).metadata()).exif, "test image should start with EXIF data");
    const cleaned = await stripImageMetadata(jpeg, "scan.jpg");
    assert.equal(cleaned.mimeType, "image/jpeg");
    assert.equal((await sharp(cleaned.data).metadata()).exif, undefined);
  });

  const [image] = await db
    .insert(medicalImages)
    .values({
      title: "Right wrist X-ray",
      filePath: "https://i.ibb.co/test/scan.png",
      thumbnailPath: "https://i.ibb.co/test/scan-thumb.png",
      modality: "xray",
      bodyRegion: "Wrist",
      uploadedBy: bobUser.id,
      isAnonymized: true,
    })
    .returning();
  const imageParams = { imageId: String(image.id) };

  await check("list images with filters", async () => {
    const all = await call(routes.images, "GET", "/api/images?modality=xray&body_region=wri", { token: aliceNow });
    assert.equal(all.status, 200);
    assert.equal(all.body.length, 1);
    assert.equal(all.body[0].uploader_name, "uid-bob");
    const none = await call(routes.images, "GET", "/api/images?modality=mri", { token: aliceNow });
    assert.equal(none.body.length, 0);
  });

  console.log("Annotations");
  const finding = {
    finding_type: "fracture",
    finding_description: "Undisplaced distal radius fracture",
    severity: "moderate",
    location_on_image: '{"x": 42.5, "y": 68.1}',
  };
  let annotationId = 0;
  await check("supporters can't annotate", async () => {
    const res = await call(routes.imageAnnotations, "POST", "/x", { token: aliceNow, body: finding, params: imageParams });
    assert.equal(res.status, 403);
  });
  await check("invalid finding type -> 422", async () => {
    const res = await call(routes.imageAnnotations, "POST", "/x", {
      token: bob,
      body: { ...finding, finding_type: "broken" },
      params: imageParams,
    });
    assert.equal(res.status, 422);
  });
  await check("out-of-range coordinates -> 422", async () => {
    const res = await call(routes.imageAnnotations, "POST", "/x", {
      token: bob,
      body: { ...finding, location_on_image: '{"x": 140, "y": 10}' },
      params: imageParams,
    });
    assert.equal(res.status, 422);
  });
  await check("doctor annotates (search indexing skipped without Gemini)", async () => {
    const res = await call(routes.imageAnnotations, "POST", "/x", { token: bob, body: finding, params: imageParams });
    assert.equal(res.status, 201);
    assert.equal(res.body.author.full_name, "uid-bob");
    annotationId = res.body.id;
  });
  await check("annotation authors don't expose contact details", async () => {
    const res = await call(routes.imageAnnotations, "GET", "/x", { token: aliceNow, params: imageParams });
    assert.equal(res.body.length, 1);
    for (const field of PRIVATE_FIELDS) assert.equal(field in res.body[0].author, false, field);
  });
  await check("only the author edits an annotation", async () => {
    const params = { annotationId: String(annotationId) };
    const denied = await call(routes.annotation, "PUT", "/x", { token: aliceNow, body: { severity: "mild" }, params });
    assert.equal(denied.status, 403);
    const ok = await call(routes.annotation, "PUT", "/x", { token: bob, body: { severity: "mild", clinical_notes: null }, params });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.severity, "mild");
    assert.equal(ok.body.finding_type, "fracture");
  });

  console.log("Comments");
  let rootId = 0;
  await check("anyone signed in can comment", async () => {
    const res = await call(routes.comments, "POST", "/x", { token: aliceNow, body: { content: "Is this a Colles fracture?" }, params: imageParams });
    assert.equal(res.status, 201);
    rootId = res.body.id;
  });
  await check("blank comment -> 422", async () => {
    const res = await call(routes.comments, "POST", "/x", { token: aliceNow, body: { content: "   " }, params: imageParams });
    assert.equal(res.status, 422);
  });
  await check("reply to a comment that doesn't exist -> 400", async () => {
    const res = await call(routes.comments, "POST", "/x", {
      token: bob,
      body: { content: "Reply", parent_id: 9999 },
      params: imageParams,
    });
    assert.equal(res.status, 400);
  });
  await check("replies are nested under their parent", async () => {
    await call(routes.comments, "POST", "/x", { token: bob, body: { content: "Yes, dorsal angulation.", parent_id: rootId }, params: imageParams });
    const res = await call(routes.comments, "GET", "/x", { token: aliceNow, params: imageParams });
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].replies.length, 1);
    assert.equal(res.body[0].replies[0].content, "Yes, dorsal angulation.");
  });
  await check("image detail has counts and a public uploader", async () => {
    const res = await call(routes.image, "GET", "/x", { token: aliceNow, params: imageParams });
    assert.equal(res.body.annotation_count, 1);
    assert.equal(res.body.comment_count, 2);
    for (const field of PRIVATE_FIELDS) assert.equal(field in res.body.uploader, false, field);
  });

  console.log("Unconfigured services");
  await check("AI question reports Gemini not configured", async () => {
    const res = await call(routes.ask, "POST", "/api/ai/ask", { token: aliceNow, body: { question: "What does a Colles fracture look like?" } });
    assert.equal(res.status, 503);
  });
  await check("search reports Gemini not configured", async () => {
    const res = await call(routes.search, "GET", "/api/search?q=fracture", { token: aliceNow });
    assert.equal(res.status, 503);
  });
  await check("checkout reports Stripe not configured", async () => {
    const res = await call(routes.checkout, "POST", "/x", { body: { amount_cents: 2500 } });
    assert.equal(res.status, 503);
  });
  await check("supporter config is public", async () => {
    const res = await call(routes.config, "GET", "/x");
    assert.equal(res.status, 200);
    assert.equal(res.body.app_tag, "healthlms");
  });

  console.log("Rate limit and deletes");
  await check("one scholar search per minute per caller", async () => {
    assert.equal((await claimRateLimit(db, "test:caller", 60)).allowed, true);
    const second = await claimRateLimit(db, "test:caller", 60);
    assert.equal(second.allowed, false);
    assert.ok(second.retryAfterSeconds > 0 && second.retryAfterSeconds <= 60);
    assert.equal((await claimRateLimit(db, "test:other-caller", 60)).allowed, true);
  });
  await check("only the uploader deletes an image, and it cascades", async () => {
    assert.equal((await call(routes.image, "DELETE", "/x", { token: aliceNow, params: imageParams })).status, 403);
    assert.equal((await call(routes.image, "DELETE", "/x", { token: bob, params: imageParams })).status, 204);
    assert.equal((await call(routes.image, "GET", "/x", { token: bob, params: imageParams })).status, 404);
    const params = { annotationId: String(annotationId) };
    assert.equal((await call(routes.annotation, "DELETE", "/x", { token: bob, params })).status, 404);
  });

  console.log(`\nAll ${passed} checks passed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
