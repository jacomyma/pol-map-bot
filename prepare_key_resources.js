import { getLogger } from "./-get-logger.js"
import * as fs from "fs";
import * as d3 from 'd3';
import { createCanvas, loadImage, ImageData } from "canvas"
import dotenv from "dotenv";

dotenv.config();

export async function prepare_key_resources(date, forceMode) {

	const targetDate = ((date === undefined)?(new Date() /*Now*/):(new Date(date)))
	const year = targetDate.getFullYear()
	const month = (1+targetDate.getMonth()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
	const datem = (targetDate.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})

	// Logger
	const logger = getLogger(`logs/prepare_key_resources.log`)
	logger.level = "trace"

	// MAIN
	async function main() {
		logger.info('***** prepare_key_resources ****');

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


		// Check if the target files exist.
		// If so, and if not force mode, then just ship them.
		const targetJpgFile = `${archiveFolder}/key-resources.jpg`
		const targetCsvFile = `${archiveFolder}/key-resources.csv`
		if (!forceMode && fs.existsSync(targetJpgFile) && fs.existsSync(targetCsvFile)) {
			logger
				.info(`Key resources retrieved for the ${year}-${month}-${datem}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({
					success:true,
					jpgFile:targetJpgFile,
					csvFile:targetCsvFile,
					msg:`Key resources existing for the ${year}-${month}-${datem}.`
				}));
				logger.end();
		  });
		}

		/// IMAGE
		
		// Canvas
		let canvas = createCanvas(3590, 3590)
		const ctx = canvas.getContext("2d")

		// Check whether there is a source PNG
		const sourcePngFile = `${sourceFolder}/Key resources.png`
		let keyResourcesImg
		if (fs.existsSync(sourcePngFile)) {
			keyResourcesImg = await loadImage(sourcePngFile)
			ctx.drawImage(keyResourcesImg, 0, 0)
		} else {
			logger
				.error(`No key resources PNG file found at ${sourcePngFile}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when looking at the source material for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Get image buffer
		const buffer = canvas.toBuffer('image/jpeg')
		
		// Save the JPG in the archive repository
		try {
			fs.writeFileSync(targetJpgFile, buffer, "binary")
			logger
				.info(`Key resources JPG archived for the ${year}-${month}-${datem}.`);
		} catch (error) {
			logger
				.error(`Error: the key resources JPG could not be archived for the ${year}-${month}-${datem}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when archiving the key resources in archive for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Save the JPG in the public repository (that day and current)
		;[
			publicFolder_thatday,
			// publicFolder_current, // For the moment, not necessary to store the image in current folder
		].forEach(folder => {
			let publicFile = `${folder}/key-resources.jpg`
			try {
				fs.writeFileSync(publicFile, buffer, "binary")
				logger
					.info(`Key resources JPG saved in ${folder}.`);
			} catch (error) {
				logger
					.error(`Error: the Key resources JPG could not be saved in ${folder}.`);
				return new Promise((resolve, reject) => {
					logger.once('finish', () => resolve({success:false, msg:`An error occurred when saving the Key resources JPG in ${folder}.`}));
					logger.end();
			  });
			}
		})


		/// CSV DATA

		// Check whether there is a CSV file
		const sourceCsvFile = `${sourceFolder}/key_resources.csv`
		let keyResourcesList
		if (fs.existsSync(sourceCsvFile)) {
			try {
				const csvString = fs.readFileSync(sourceCsvFile, "utf8")
				keyResourcesList = d3.csvParse(csvString);
				logger
					.child({ context: {sourceCsvFile} })
					.info('CSV file loaded');
			} catch (error) {
				logger
					.child({ context: {sourceCsvFile, error:error.message} })
					.error('The CSV file could not be loaded');
				return new Promise((resolve, reject) => {
					logger.once('finish', () => resolve({success:false, msg:`An error occurred when loading the source material for the ${year}-${month}-${datem}.`}));
					logger.end();
			  });
			}
		} else {
			logger
				.error(`No key resources CSV file found at ${sourceCsvFile}.`);
			return new Promise((resolve, reject) => {
				logger.once('finish', () => resolve({success:false, msg:`An error occurred when looking at the source material for the ${year}-${month}-${datem}.`}));
				logger.end();
		  });
		}

		// Save the CSV in the archive repository
		try {
			const csvString = d3.csvFormat(keyResourcesList)
			fs.writeFileSync(targetCsvFile, csvString)
			logger
				.child({ context: {targetCsvFile} })
				.info('Key resources CSV file archived successfully');
		} catch(error) {
			logger
				.child({ context: {targetCsvFile, error} })
				.error('The key resources CSV file could not be archived');
			return {success:false, msg:"The key resources CSV file could not be archived."}
		}

		// Filter CSV for the public
		const keyResourcesListPublic = keyResourcesList.map(res => {
			return {
				rank: res.rank,
				id: res.id,
				type: res.type,
				url: res.url,
				broadcast_by_mps: res.count,
				bcing_mps_group: res.groups,
			}
		})

		// Save the JPG in the public repository (that day and current)
		;[
			publicFolder_thatday,
			// publicFolder_current, // For the moment, not necessary to store the image in current folder
		].forEach(folder => {
			let publicFile = `${folder}/key-resources.csv`
			try {
				const csvString = d3.csvFormat(keyResourcesListPublic)
				fs.writeFileSync(publicFile, csvString)
				logger
					.info(`Key resources CSV saved in ${folder}.`);
			} catch (error) {
				logger
					.error(`Error: the Key resources CSV could not be saved in ${folder}.`);
				return new Promise((resolve, reject) => {
					logger.once('finish', () => resolve({success:false, msg:`An error occurred when saving the Key resources CSV in ${folder}.`}));
					logger.end();
			  });
			}
		})

		return new Promise((resolve, reject) => {
			logger.once('finish', () => resolve({success:true, file:targetFile, msg:`Key resources prepared.`}));
			logger.end();					
	  });
	}

	return main();
}
