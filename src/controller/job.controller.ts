import { Request, Response, NextFunction } from "express";
import { responseSender } from "../util";
import path from "path";
import fs from "fs";
import { Op, Order, WhereOptions } from "sequelize";
import JobService from "../service/job.service";
import { JobAttributes } from "../model/job.model";

class JobController {
	private jobService: JobService;

	constructor() {
		this.jobService = new JobService();
	}

	createJob = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const newJob = {
				title: (req as any).validatedValue.title,
				content: (req as any).validatedValue.content,
				jobLocation: (req as any).validatedValue.jobLocation,
				applicationUrl: (req as any).validatedValue.applicationUrl,
				status: (req as any).validatedValue.status,
			};
			const createdJob = await this.jobService.createJob(
				newJob.title,
				newJob.content,
				newJob.jobLocation,
				newJob.applicationUrl,
				newJob.status,
			);

			if (!createdJob) {
				if (req.file) {
					const filePath = path.join(
						req.file.destination,
						req.file.filename,
					);

					fs.unlink(filePath, (unlinkErr) => {
						if (unlinkErr) {
							// Optionally log the error
						}
					});
				}

				return responseSender(res, 400, "Job could not be created");
			}

			return responseSender(res, 201, "Job created successfully.", {
				job: createdJob,
			});
		} catch (err: any) {
			
			next(err);
		}
	};

	editJob = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const editedJob = {
				jobId: (req as any).validatedValue.jobId,
				title: (req as any).validatedValue.title,
				content: (req as any).validatedValue.content,
				jobLocation: (req as any).validatedValue.jobLocation,
				applicationUrl: (req as any).validatedValue.applicationUrl,
				status: (req as any).validatedValue.status,
			};

			const isJobExist = await this.jobService.getJobById(
				editedJob.jobId,
			);
			if (!isJobExist) {
				return responseSender(res, 400, "Job does not exist");
			}

			const isEditedJob = await this.jobService.editJob(
				editedJob.jobId,
				editedJob.title,
				editedJob.content,
				editedJob.jobLocation,
				editedJob.applicationUrl,
				editedJob.status,
			);

			if (!isEditedJob) {
				return responseSender(res, 400, "Job could not be edited");
			}

			return responseSender(res, 200, "Job edited successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	deleteJob = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const jobId = (req as any).params.jobId;

			const isJobExist = await this.jobService.getJobById(jobId);

			if (!isJobExist) {
				return responseSender(res, 404, "Job not found.");
			}

			const isDeleted = await this.jobService.deleteJob(jobId);

			if (!isDeleted) {
				return responseSender(
					res,
					500,
					"Job deletion failed. Please try again.",
				);
			}

			return responseSender(res, 200, "Job deleted successfully.");
		} catch (err: any) {
			
			next(err);
		}
	};

	getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const searchTerm = (req as any).validatedValue.searchTerm;
			const currentPage = parseInt((req as any).validatedValue.page || 1);
			const limitPerPage = parseInt(
				(req as any).validatedValue.limit || 20,
			);
			const offset = (currentPage - 1) * limitPerPage;
			const order: Order = [["createdAt", "DESC"]];
			const filter: WhereOptions<JobAttributes> = {};

			if (searchTerm) {
				filter.title = {
					[Op.like]: `%${searchTerm}%`,
				};
			}

			const jobs = await this.jobService.getAllJobs(
				filter,
				limitPerPage,
				offset,
				order,
			);
			if (!jobs.rows) {
				return responseSender(
					res,
					400,
					"Failed to get jobs. Please try again.",
				);
			}
			return responseSender(res, 200, "Jobs fetched successfully.", {
				jobs: jobs.rows,
				total: jobs.count,
				totalPages: Math.ceil(jobs.count / limitPerPage),
				currentPage,
			});
		} catch (err: any) {
			
			next(err);
		}
	};
}

export default JobController;
