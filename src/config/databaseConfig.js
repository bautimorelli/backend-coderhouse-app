import * as dotenv from "dotenv"

dotenv.config()

const options = {
	mongoAtlas: {
		urlSessionDatabase: process.env.MONGO_SESSION_URL,
		urlUsersDatabase: process.env.MONGO_USERS_URL,
	},
}

export { options }
