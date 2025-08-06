import { writeFile } from "fs/promises";
import Replicate from "replicate";
import dotenv from "dotenv";

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateVoice() {
  try {
    const input = {
      speaker: "https://replicate.delivery/pbxt/Jt79w0xsT64R1JsiJ0LQRL8UcWspg5J4RFrU6YwEKpOT1ukS/male.wav"
    };

    const output = await replicate.run(
      "lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
      { input }
    );

    const res = await fetch(output);
    const buffer = await res.arrayBuffer();
    await writeFile("output.wav", Buffer.from(buffer));

    console.log("✅ Audio file saved as output.wav");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

generateVoice();
