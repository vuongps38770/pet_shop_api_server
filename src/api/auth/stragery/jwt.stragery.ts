import bcrypt from "bcryptjs";
async function tesddt() {
  const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM0YTRiMWZkMTkzMTNhNzMyMDNhODYiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDg0MTgzNDMsImV4cCI6MTc0OTAyMzE0M30.HszQMCgV_NXbIt2uBkNMkce596aQHcHqSykt-dmtp9g";
  const token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODM0YTRiMWZkMTkzMTNhNzMyMDNhODYiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDg0MjA5OTcsImV4cCI6MTc0OTAyNTc5N30.HHNGR6CSAxf7zul0QgXWQ5kR5HMWK6zP6FwXgbJU79o"; // khác token1 hoàn toàn
  const hash = "$2b$10$o0Inri8B/Z.P9RtQ3CRn6O3ZPr4tlW/6WlUzC/P6mFfX31/p.s65K"

  console.log(await bcrypt.compare(token1, hash)); // true
  console.log(await bcrypt.compare(token2, hash)); // false
}

tesddt();