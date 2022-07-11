import sirv from "sirv";
import path from "path";
import polka from "polka";
// @ts-ignore
import routes from "$routes";

const server = polka();
const port = process.env.PORT ?? 3000;

const resolve = path.resolve.bind(null, __dirname, "..");

server.use(
  "/assets",
  sirv(resolve("public", "assets"), {
    extensions: [],
    immutable: true,
    maxAge: 31536000, // 1Y
  })
);

routes(server);

server.get(
  "*",
  sirv(resolve("public"), {
    single: true,
  })
);

server.listen(port, () => {
  console.log(`Ready at http://localhost:${port}`);
});
