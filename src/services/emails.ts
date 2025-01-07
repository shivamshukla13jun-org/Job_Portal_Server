import nodemailer from "nodemailer"
import dotenv from "dotenv"
import ejs from "ejs"
import path from "path";
import { AppError } from "@/middlewares/error";

dotenv.config()

export interface IEmail {
    email: string;
    subject: string;
    text?: string;
    template?: string;
    data?:any
}

export const sendEmail = async ({ email, subject, text, template,data }: IEmail) => {
    try {
        const templatePath = path.join(process.cwd(), `views`,`${template}.ejs`);
  const emailBody = await ejs.renderFile(templatePath, data);

        const transporter = nodemailer.createTransport({
            service: process.env.MAIL_HOST,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            }
        })

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: email,
            subject: subject,
            text: text,
            html: emailBody  as string // Added HTML option
        }

        const info = await transporter.sendMail(mailOptions)

        return info
    } catch (error) {
        console.error('Email sending error:', error);
        throw new AppError('Failed to send Email', 500)
    }
}

