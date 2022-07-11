import { Plugin, build } from "vite";
import path from "path";
import polka from "polka";

export const mix = (entry = "server.ts"): Plugin => {
  let root = process.cwd();
  let clientOutDir: string | undefined;

  const getHandlerFile = () => {
    return path.resolve(root, entry);
  };

  return {
    name: "polka",

    configResolved: (config) => {
      root = config.root;
      clientOutDir = path.resolve(root, config.build.outDir);
    },

    configureServer: (devServer) => {
      devServer.middlewares.use(async (req, res, next) => {
        try {
          const filepath = getHandlerFile();
          const mod = await devServer.ssrLoadModule(`/@fs/${filepath}`);
          const server = polka({ onNoMatch: () => next() });
          mod.default(server);
          server.handler(req as any, res);
        } catch (error) {
          if (error instanceof Error) {
            devServer.ssrFixStacktrace(error);
            process.exitCode = 1;
            next(error);
          }
        }
      });
    },

    writeBundle: async () => {
      if (process.env.POLKA_SSR_BUILD) return;
      process.env.POLKA_SSR_BUILD = "true";

      const filepath = getHandlerFile();

      await build({
        root,
        resolve: {
          alias: {
            $routes: filepath,
          },
        },
        build: {
          outDir: path.resolve(clientOutDir!, "..", "server"),

          ssr: true,
          rollupOptions: {
            input: {
              handler: filepath,
              server: path.join(__dirname, entry),
            },
          },
        },
      });
    },
  };
};
