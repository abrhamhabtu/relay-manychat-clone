// Prints the sample data (src/demo_seed.js) as SQL, for scripts/preview.sh and `npm run setup`'s demo database.
import { demoSeed } from "../src/demo_seed.js";

console.log(demoSeed(Date.now()).join("\n"));
