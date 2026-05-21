import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_ucgtmbscyxlzdlgokyps",
  dirs: ["./src/trigger"],
  maxDuration: 600, // 10 minutes — needed for transcription + AI analysis
});
