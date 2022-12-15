import "dotenv/config";
import * as fs from "fs";
import got from "got";
import chalk from "chalk";
import { oraPromise } from "ora";

const error = chalk.bold.red;

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_DEPLOYMENT = process.argv[2];
const DESTDIR = process.argv[3] || VERCEL_DEPLOYMENT;
const VERCEL_TEAM = process.env.VERCEL_TEAM;

try {
  if (VERCEL_TOKEN === undefined) {
    console.log(
      error(
        "Missing VERCEL_TOKEN in .env file. \n\nLook at README for more information"
      )
    );
  } else if (VERCEL_DEPLOYMENT === undefined) {
    console.log(error("Missing deployment URL or id"));
    console.log(
      "\ne.g: node index.js example-5ik51k4n7.vercel.app",
      "\ne.g: node index.js dpl_6CR1uw9hBdpWgrMvPkncsTGRC18A"
    );
  } else {
    await main();
  }
} catch (err) {
  console.log(error(err.stack || err));
}

async function main() {
  const deploymentId = VERCEL_DEPLOYMENT.startsWith("dpl_")
    ? VERCEL_DEPLOYMENT
    : await oraPromise(
      getDeploymentId(VERCEL_DEPLOYMENT),
      "Getting deployment id"
    );
  const srcFiles = await oraPromise(
    getDeploymentSource(deploymentId),
    "Loading source files tree"
  );
  if (!fs.existsSync(DESTDIR)) fs.mkdirSync(DESTDIR);
  Promise.allSettled(
    srcFiles
      .map((file) => {
        let pathname = file.name.replace("src", DESTDIR);
        if (fs.existsSync(pathname)) return null;
        if (file.type === "directory") fs.mkdirSync(pathname);
        if (file.type === "file") {
          return oraPromise(
            downloadFile(deploymentId, file.uid, pathname),
            `Downloading ${pathname}`
          );
        }
      })
      .filter(Boolean)
  );
}

async function getDeploymentSource(id) {
  let path = `/v6/deployments/${id}/files`;
  if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`;
  const files = await getJSONFromAPI(path);
  // Get only src directory
  const source = files.find((x) => x.name === "src");
  // Flatten tree structure to list of files/dirs for easier downloading
  return flattenTree(source);
}

async function getDeploymentId(domain) {
  const deployment = await getJSONFromAPI(`/v13/deployments/${domain}`);
  return deployment.id;
}

async function downloadFile(deploymentId, fileId, destination) {
  let path = `/v6/deployments/${deploymentId}/files/${fileId}`;
  if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`;
  const response = await getFromAPI(path, true);
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(destination);
    response.pipe(writeStream);
    response.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on("finish", resolve);
  });
}

function getFromAPI(path, binary = false) {
  return (binary ? got.stream : got)(`https://api.vercel.com${path}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
    retry: {
      limit: 0,
    },
  });
}

function getJSONFromAPI(path) {
  return getFromAPI(path).json();
}

function flattenTree({ name, children = [] }) {
  let childrenNamed = children.map((child) => ({
    ...child,
    name: `${name}/${child.name}`,
  }));
  return Array.prototype.concat.apply(
    childrenNamed,
    childrenNamed.map(flattenTree)
  );
}
