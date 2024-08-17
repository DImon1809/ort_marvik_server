import * as nodeMailer from 'nodeMailer';

import {
  patternBid,
  patterNotification,
  patternRegister,
} from 'src/nodemailer/patterns/patterns-message';

export const sendMail = async (
  isRegister: boolean,
  email: string,
  name: string,
  pass: string,
  code?: string,
): Promise<unknown | boolean> => {
  const transporter = nodeMailer.createTransport(
    {
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: 'klimov.dmitrij.02@mail.ru',
        pass,
      },
    },
    {
      from: 'Не требует ответа. Сообщение от <klimov.dmitrij.02@mail.ru>',
    },
  );

  const mailer = async (message: {
    to: string;
    subject: string;
    html: string;
  }) => transporter.sendMail(message, (err) => (err ? err : true));

  if (!isRegister) {
    await mailer(patternBid(email, name));

    return await mailer(patterNotification(email, name));
  }

  if (isRegister && code) {
    return await mailer(patternRegister(email, name, code));
  }
};
