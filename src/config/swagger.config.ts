import swaggerJSDoc from "swagger-jsdoc";

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Sample API",
			version: "1.0.0",
			description: "API documentation for the Sample API",
		},
		servers: [
			{
				url: "http://localhost:4000",
				description: "Development Server",
			},
		],
		// paths: {
		// 	"/users": {
		// 		get: {
		// 			summary: "Get all users",
		// 			description: "Retrieve a list of all users",
		// 			tags: ["Users"],
		// 			responses: {
		// 				200: {
		// 					description: "A list of users",
		// 					content: {
		// 						"application/json": {
		// 							schema: {
		// 								type: "array",
		// 								items: {
		// 									$ref: "#/components/schemas/User",
		// 								},
		// 							},
		// 						},
		// 					},
		// 				},
		// 				500: {
		// 					description: "Server error",
		// 				},
		// 			},
		// 		},
		// 	},
		// 	"/users/{id}": {
		// 		get: {
		// 			summary: "Get a user by ID",
		// 			description: "Retrieve user details by their ID",
		// 			tags: ["Users"],
		// 			parameters: [
		// 				{
		// 					name: "id",
		// 					in: "path",
		// 					required: true,
		// 					description: "The ID of the user",
		// 					schema: {
		// 						type: "integer",
		// 					},
		// 				},
		// 			],
		// 			responses: {
		// 				200: {
		// 					description: "User details",
		// 					content: {
		// 						"application/json": {
		// 							schema: {
		// 								$ref: "#/components/schemas/User",
		// 							},
		// 						},
		// 					},
		// 				},
		// 				404: {
		// 					description: "User not found",
		// 				},
		// 			},
		// 		},
		// 	},
		// },
		components: {
			schemas: {
				User: {
					type: "object",
					properties: {
						id: {
							type: "integer",
							description: "The user's unique ID",
						},
						name: {
							type: "string",
							description: "The user's name",
						},
						email: {
							type: "string",
							description: "The user's email address",
						},
					},
				},
			},
		},
	},
	apis: ["../routes/user.route.js"], // You can also include JSDoc comments from route files here
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
