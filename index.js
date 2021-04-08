const fs = require('fs');
const got = require('got');
const download = require('download');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config()

let VERCEL_TOKEN = ""
let VERCEL_URL = ""
let DESTDIR = ""

const fileTree = [];

const error = chalk.bold.red;
const success = chalk.keyword('green');

function main() {
     VERCEL_TOKEN = process.env.VERCEL_TOKEN
	 VERCEL_URL = process.argv[2]
     DESTDIR = process.argv[3] || VERCEL_URL

	if (VERCEL_TOKEN === undefined || VERCEL_TOKEN === "") {
		console.log(error("Please add your Vercel Token in .env file. \n\nLook at Readme for more informations"))
		return
	}

    if (VERCEL_URL === undefined || VERCEL_URL === "") {
		console.log(error("Please pass the Vercel URL:"))
        console.log("\ne.g: node index.js brazilianswhodesign-5ik51k4n7.vercel.app")
		return
	}

	getSourceCode()
}

main()

async function getSourceCode() {
   const spinner = ora('Loading file tree').start();
   await getFileTree("src/")
   
   for (let i = 0; i < fileTree.length; i++) {
       const f = fileTree[i];

       if (f.type == "directory") { 
            await getFileTree(`${f.name}`)
       }

       if (f.type == "file") {
         spinner.text = `Downloading ${f.name}`;
         await downloadFile(f.link, f.dir)
       }
   }

   spinner.stop()
   console.log(success("Source code downloaded. ✨"))
}

async function downloadFile(url, dir) { 
    let filename = url.split("/").pop()
    let path = `${DESTDIR}${dir}`

    if (fs.existsSync(`${path}/${filename}}`)) {
        return
    }
 
    await download(url, path, {
        headers: {
    		'Authorization': `Bearer ${VERCEL_TOKEN}`,
    	} 
    })
}


async function getFileTree(dir) { 
    const response = await got(`https://vercel.com/api/now/file-tree/${VERCEL_URL}?base=${dir}`, { 
    	headers: {
    		'Authorization': `Bearer ${VERCEL_TOKEN}`,
    	} 
    });

    const result = JSON.parse(response.body)
    const tree = result.map((f) => { 
        if (f.type == "directory") { 
            f.name = `${dir}${f.name}/` 
        }

        if (f.type == "file") { 
            f.dir = `${dir.replace('src/', '/')}`
        }
        
        return f
    })

    fileTree.push(...tree)
}
