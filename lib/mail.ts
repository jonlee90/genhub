import nodemailer from "nodemailer";
export interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export type SendEmailHandler = (params: SendEmailParams) => Promise<void>;

// Use MAIL_FROM from env or fallback to MAIL_USER
const from = process.env.MAIL_FROM || process.env.MAIL_USER || "noreply@genhub.com";

export const send: SendEmailHandler = async ({ to, subject, text, html }) => {
	console.log('[MAIL] Attempting to send email');
	console.log('[MAIL] From:', from);
	console.log('[MAIL] To:', to);
	console.log('[MAIL] Host:', process.env.MAIL_HOST);
	console.log('[MAIL] Port:', process.env.MAIL_PORT);

	const mailPort = Number.parseInt(process.env.MAIL_PORT as string, 10);
	const transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST as string,
		port: mailPort,
		secure: mailPort === 465, // Use SSL for port 465, STARTTLS for 587
		auth: {
			user: process.env.MAIL_USER as string,
			pass: (process.env.MAIL_PASS as string).replace(/\s/g, ''), // Remove spaces from app password
		},
		debug: true, // Enable debug logging
		logger: true, // Enable logger
		tls: {
			// Do not fail on invalid certs (for development)
			rejectUnauthorized: false,
		},
	});

	try {
		const result = await transporter.sendMail({
			to,
			from,
			subject,
			text,
			html,
		});
		console.log('[MAIL] Email sent successfully:', result.messageId);
		// Return void to match SendEmailHandler type
	} catch (error) {
		console.error('[MAIL] Email sending failed:', error);
		throw error;
	}
};
