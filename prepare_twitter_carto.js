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
		const archiveFolder = `${process.env.DATA_ARCHIVE_FOLDER}/${year}/${month}/${datem}`
		const publicFolder_thatday = `${process.env.DATA_PUBLIC_FOLDER}/${year}/${month}/${datem}`
		const publicFolder_current = `${process.env.DATA_PUBLIC_FOLDER}/current`
		;[
			archiveFolder,
			publicFolder_thatday,
			publicFolder_current,
		].forEach(folder => {
			if (!fs.existsSync(folder)){
			    fs.mkdirSync(folder, { recursive: true });
			}
		})


		// Check if the target file exists.
		// If so, and if not force mode, then just ship it.
		const targetFile = `${archiveFolder}/daily-carto.jpg`
		if (!forceMode && fs.existsSync(targetFile)) {
			logger
				.info(`Daily carto retrieved for the ${year}-${month}-${datem}.`);
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

		// Get image buffer
		const buffer = canvas.toBuffer('image/jpeg')
		
		// Save the image in the archive repository
		try {
			fs.writeFileSync(targetFile, buffer, "binary")
			logger
				.info(`Daily carto archived for the ${year}-${month}-${datem}.`);
		} catch (error) {
			logger
				.error(`Error: the daily carto could not be saved for the ${year}-${month}-${datem}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when saving the daily carto in archive for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Save the image in the public repository (that day and current)
		;[
			publicFolder_thatday,
			// publicFolder_current, // For the moment, not necessary to store the image in current folder
		].forEach(folder => {
			let publicFile = `${folder}/daily-carto.jpg`
			try {
				fs.writeFileSync(publicFile, buffer, "binary")
				logger
					.info(`Daily carto saved in ${folder}.`);
			} catch (error) {
				logger
					.error(`Error: the daily carto could not be saved in ${folder}.`);
				return new Promise((resolve, reject) => {
					logger.once('finish', () => resolve({success:false, msg:`An error occurred when saving the daily carto in ${folder}.`}));
					logger.end();
			  });
			}
		})

		return new Promise((resolve, reject) => {
			logger.once('finish', () => resolve({success:true, file:targetFile, msg:`Daily carto prepared.`}));
			logger.end();					
	  });
	}

	return main();
}
