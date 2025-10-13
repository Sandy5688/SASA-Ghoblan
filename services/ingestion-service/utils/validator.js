export function checkDemoKey(req, res, next) {
  const demoKey = req.header("X-Demo-Key");
  if (!demoKey || demoKey !== process.env.DEMO_KEY) {
    return res.status(401).json({ error: "Invalid or missing X-Demo-Key" });
  }
  next();
}
