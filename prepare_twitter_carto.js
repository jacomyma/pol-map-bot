import { getLogger } from "./-get-logger.js"
import * as fs from "fs";
import { createCanvas, loadImage, ImageData } from "canvas"
import dotenv from "dotenv";

dotenv.config();

export async function prepare_twitter_carto(date, forceMode) {

	const targetDate = ((date === undefined)?(new Date() /*Now*/):(new Date(date)))
	const year = targetDate.getFullYear()
	const month = (1+targetDate.getMonth()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
	const datem = (targetDate.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})

	// Logger
	const logger = getLogger(`logs/prepare_twitter_carto.log`)
	logger.level = "trace"

	// MAIN
	async function main() {
		logger.info('***** RUN SCRIPT ****');

		// Folders
		const sourceFolder = `${process.env.DATA_SOURCE_FOLDER}/${year}/${month}/${datem}`
		const targetFolder = `${process.env.DATA_ARCHIVE_FOLDER}/${year}/${month}/${datem}`
		if (!fs.existsSync(targetFolder)){
		    fs.mkdirSync(targetFolder, { recursive: true });
		}

		// Check if the target file exists.
		// If so, and if not force mode, then just ship it.
		const targetFile = `${targetFolder}/daily-carto.jpg`
		if (!forceMode && fs.existsSync(targetFile)) {
			logger
				.info(`Daily carto saved for the ${year}-${month}-${datem}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:true, file:targetFile, msg:`Daily carto existing for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}
		
		// Canvas
		let canvas = createCanvas(3590, 3590)
		const ctx = canvas.getContext("2d")

		// Check whether there is a source image for the carto
		const sourceFileCarto = `${sourceFolder}/Carto Twitter.png`
		let cartoTwitterImg
		if (fs.existsSync(sourceFileCarto)) {
			cartoTwitterImg = await loadImage(sourceFileCarto)
			ctx.drawImage(cartoTwitterImg, 0, 0)
		} else {
			logger
				.error(`No Twitter carto file found at ${sourceFileCarto}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when looking at the source material for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Check whether there is a source image for the legend
		const sourceFileLegend = `${sourceFolder}/Legend Twitter.png`
		let legendTwitterImg
		if (fs.existsSync(sourceFileLegend)) {
			legendTwitterImg = await loadImage(sourceFileLegend)
			ctx.drawImage(legendTwitterImg, 0, 0)
		} else {
			logger
				.error(`No Twitter legend file found at ${sourceFileLegend}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when looking at the source material for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Save the image in the target repository

		let buffer = canvas.toBuffer('image/jpeg')
		try {
			fs.writeFileSync(targetFile, buffer, "binary")
			logger
				.info(`Daily carto saved for the ${year}-${month}-${datem}.`);
	  
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:true, file:targetFile, msg:`Daily carto saved for the ${year}-${month}-${datem}.`}));
				logger.end();					
		  });
		} catch (error) {
			logger
				.error(`Error: the daily carto could not be saved for the ${year}-${month}-${datem}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when saving the PNG for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}
	}

	return main();
}

// Command line arguments
// Date argument
let date = undefined
const dateArgRegexp = /d(ate)?=([0-9]{4}\-[0-9]{2}\-[0-9]{2})/i
process.argv.forEach(d => {
	let found = d.match(dateArgRegexp)
	if (found && found[2]) {
		date = found[2]
	}
})
// Auto mode (run the script)
if (process.argv.some(d => ["a","-a","auto","-auto"].includes(d))) {
	console.log("Run script"+((date)?(" on date "+date):("")))
	prepare_twitter_carto(date)
}