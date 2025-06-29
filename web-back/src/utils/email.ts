import { Resend } from "resend";
import dotenv from 'dotenv';

dotenv.config;

const resend = new Resend (process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email:string,token:string) {
    const link =  `http://localhost:3000/verify-email?token=${token}`;

     return resend.emails.send({
    from: 'Your App <noreply@yourdomain.com>',
    to: [email],
    subject: 'Please verify your email',
    html: `<p>Click the link below to verify your email:</p><a href="${link}">${link}</a>`,
  });
}
