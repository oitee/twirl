import assert from "assert";
import { insertUser } from "../../src/models/users.js";
import { shortenLink, expandLink } from "../../src/controllers/links.js";
import { pool } from "../../src/db/connection.js";

/*
  Create two users
  For user1, shorten link1
  For user1, shorten link1 again
  Check count is zero for link 1
  Expand link1
  Check count of link1 = 1
  Check user2 can shorten link1 and shortened Links are not equal
  Check second shorten link has count zero
  Check that user 1 can shorten link2 with count zero
  Expand short link1 and short link2
*/

async function testLinkShortening() {
  let alice = await insertUser("Alice", "testPassword", "normal");
  let bob = await insertUser("Bob", "testPassword2", "normal");

  let link1 = "https://otee.dev/2021/11/03/diwali-hack-week.html";
  let link2 = "https://github.com/oitee";

  //----------------------------------------------------------------
  // SHORTEN LINK1 BY ALICE
  //----------------------------------------------------------------

  let shortLink1Alice = await shortenLink(alice, link1);
  assert(shortLink1Alice.status, "Status of short link 1 should be true");
  await validateAccessedCount(shortLink1Alice.shortLink, 0, alice);

  //----------------------------------------------------------------
  // EXPAND SHORT LINK1 BY ALICE
  //----------------------------------------------------------------

  let longLink1Alice = await expandLink(shortLink1Alice.shortLink);
  assert(
    longLink1Alice.status,
    "Status of long version of short link 1 should be true"
  );
  assert.equal(
    longLink1Alice.longLink,
    link1,
    "Original link 1 and long version of short link 1 should be true"
  );
  await validateAccessedCount(shortLink1Alice.shortLink, 1, alice);

  //----------------------------------------------------------------
  // EXPAND SHORT LINK1 BY BOB
  //----------------------------------------------------------------

  let longLink1Bob = await expandLink(shortLink1Alice.shortLink);
  assert.equal(
    longLink1Bob.status,
    true,
    "Status of long version of link 1 generated by user 1 should be false, if requested by BOB"
  );
  assert.equal(
    longLink1Bob.longLink,
    link1,
    "Expansion can be done by any user"
  );

  //----------------------------------------------------------------
  // SHORTEN LINK1 BY BOB
  //----------------------------------------------------------------
  shortLink1Alice = await shortenLink(bob, link1);
  assert(
    shortLink1Alice.status,
    "Status of short link 1 generated by user 2 should be true"
  );

  //----------------------------------------------------------------
  // EXPAND SHORT LINK1 BY BOB
  //----------------------------------------------------------------
  longLink1Bob = await expandLink(shortLink1Alice.shortLink);
  assert.equal(
    longLink1Bob.status,
    true,
    "Status of long version of link 1 generated by user 2 should be true, when requested by BOB"
  );
  await validateAccessedCount(shortLink1Alice.shortLink, 1, bob);

  //----------------------------------------------------------------
  // COMPARE SHORT LINK1 GENERATED BY USERS 1 & 2
  //----------------------------------------------------------------
  assert.equal(
    longLink1Alice.longLink,
    longLink1Bob.longLink,
    "Long links for the same original link, should be same for users 1 and 2"
  );

  //----------------------------------------------------------------
  // SHORTEN LINK2 BY ALICE
  //----------------------------------------------------------------
  let shortLink2Alice = await shortenLink(alice, link2);
  assert(shortLink2Alice.status, "Status of short link2 should be true");

  //----------------------------------------------------------------
  // EXPAND SHORT LINK2 BY ALICE
  //----------------------------------------------------------------

  let longLink2 = await expandLink(shortLink2Alice.shortLink);
  assert(
    longLink2.status,
    "Status of long version of short link 2 should be true"
  );
  assert.equal(
    longLink2.longLink,
    link2,
    "Original link 2 and long version of short link 2 should be true"
  );
  await validateAccessedCount(shortLink2Alice.shortLink, 1, alice);

  //----------------------------------------------------------------
  // SHORTEN LINK3 BY ALICE TWICE
  //----------------------------------------------------------------
  let link3 = "https://www.google.com/";
  let shortLink3AliceFirst = await shortenLink(alice, link3);
  let shortLink3AliceSecond = await shortenLink(alice, link3);
  assert.equal(
    shortLink3AliceFirst.shortLink,
    shortLink3AliceSecond.shortLink,
    "Short links for same link by same user, to be equal"
  );
  await validateAccessedCount(shortLink3AliceFirst.shortLink, 0, alice);
}

beforeAll(async () => {
  await pool.query(`
  DROP TABLE IF EXISTS counters;
  DROP TABLE IF EXISTS links;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS roles;
  CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT);
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    role_id INTEGER REFERENCES roles (id));
  INSERT INTO roles (name) values ('admin') , ('normal'), ('superAdmin');
  CREATE TABLE counters(
    id TEXT PRIMARY KEY,
    value INTEGER  
);
  INSERT INTO counters (id, value) values ('link_counter', 0);
  UPDATE counters SET value=value+1 WHERE id='link_counter' RETURNING value;

  CREATE TABLE links (
    user_id UUID REFERENCES users (id),
    original_link TEXT NOT NULL,
    short_link TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 'true',
    accessed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, original_link)
);`);
});
afterAll(async () => {
  await pool.end();
});

await test("Test shortening and expansion of links", testLinkShortening);

async function validateAccessedCount(shortLink, expectedCount, userID) {
  let res = await pool.query(
    "SELECT accessed_count FROM links where short_link=$1 AND user_id=$2",
    [shortLink, userID]
  );
  if (res.rows.length !== 1) {
    return -1;
  }
  assert.equal(
    res.rows[0]["accessed_count"],
    expectedCount,
    `The accessed count for ${shortLink}, should be ${expectedCount}`
  );
}
