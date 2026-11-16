import { getInventoryList } from './src/lib/data/dashboard';

async function run() {
  try {
    const res = await getInventoryList();
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

run();
