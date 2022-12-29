import * as Mongoose from "mongoose";

let database: Mongoose.Connection;

export const connect = async () => {
	// add your own uri below
	const uri = process.env.URLDB
	if (!uri) {
		throw new Error(
			'Please define the URLDB environment variable'
		)
	}
	if (database) {
		// console.log("Already connected to database");
		return;
	}
	const opts = {
            bufferCommands: false,
            useNewUrlParser: true,
            //useUnifiedTopology: true,
            //useFindAndModify: false,
            //useCreateIndex: true
        }

	await Mongoose.connect(uri, opts);
	database = Mongoose.connection;
	database.once("open", async () => {
		// console.log("Connected to database");
	});
	database.on("error", () => {
		console.log("Error connecting to database");
	});
};
export const disconnect = async () => {
	if (!database) {
		return;
	}
	await Mongoose.disconnect();
};
