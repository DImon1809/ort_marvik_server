export const patternMessage = (to: string, subject: string) => {
  return {
    to,
    subject,
    html: `<h1>Ваш код регистрации</h1>`,
  };
};
