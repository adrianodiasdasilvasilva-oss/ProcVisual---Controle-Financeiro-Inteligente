async function test() {
  try {
    console.log("Fetching http://localhost:3000/v1/test...");
    const res = await fetch('http://localhost:3000/v1/test');
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (e: any) {
    console.error("Fetch failed:", e.message);
  }
}
test();
