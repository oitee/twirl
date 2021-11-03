import { hashPassword, matchPassword } from "../../src/controllers/users";
import assert from "assert";

function verifyPasswordHashing() {
  let password1 = "123abc12";
  let password2 = "12334zyx";
  let hashedPassword1 = hashPassword(password1);
  let hashedPassword2 = hashPassword(password2);
  assert(
    matchPassword(hashedPassword1, password1),
    "Salted hashed values can be matched"
  );
  assert(
    matchPassword(hashedPassword2, password2),
    "Salted hashed values can be matched"
  );
  assert(
    hashedPassword1 !== hashPassword(password1),
    "Different salted hashed values with the same input password"
  );
  assert(
    hashedPassword2 !== hashPassword(password2),
    "Different salted hashed values with the same input password"
  );
}

test("Password hashing and salting test", verifyPasswordHashing);
