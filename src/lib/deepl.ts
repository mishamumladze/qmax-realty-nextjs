import * as deepl from "deepl-node";

const apiKey = process.env.DEEPL_API_KEY;

if (!apiKey) {
  throw new Error("DEEPL_API_KEY environment variable is not defined.");
}

export const translator = new deepl.DeepLClient(apiKey);
