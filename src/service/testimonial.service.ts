import { Order, WhereOptions } from "sequelize";
import Testimonial, { TestimonialAttributes } from "../model/testimonial.model";

class TestimonialService {
	addTestimonial = async (
		title: string,
		description: string,
	): Promise<Testimonial | TestimonialAttributes | null> => {
		try {
			const createdTestimonial = await Testimonial.create({
				title,
				description,
			});

			return createdTestimonial ? createdTestimonial.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	editTestimonial = async (
		testimonialId: number,
		title: string,
		description: string,
	): Promise<Testimonial | TestimonialAttributes | null> => {
		try {
			const testimonial = await Testimonial.findByPk(testimonialId);

			if (testimonial) {
				testimonial.title = title;
				testimonial.description = description;
				await testimonial.save();
				return testimonial.toJSON();
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};

	getTestimonialById = async (
		testimonialId: number,
	): Promise<Testimonial | TestimonialAttributes | null> => {
		try {
			const testimonial = await Testimonial.findByPk(testimonialId);

			return testimonial ? testimonial.toJSON() : null;
		} catch (err: any) {
			
			throw err;
		}
	};

	deleteTestimonial = async (testimonialId: number): Promise<boolean> => {
		try {
			const testimonial = await Testimonial.findByPk(testimonialId);

			if (testimonial) {
				await testimonial.destroy();
				return true;
			}
			return false;
		} catch (err: any) {
			
			throw err;
		}
	};

	getAllTestimonials = async (): Promise<
		Testimonial[] | TestimonialAttributes[] | null
	> => {
		try {
			const testimonials = await Testimonial.findAll();
			if (testimonials) {
				return testimonials.map((testimonial) => testimonial.toJSON());
			}
			return null;
		} catch (err: any) {
			
			throw err;
		}
	};
}

export default TestimonialService;
