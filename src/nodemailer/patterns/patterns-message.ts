export const patternBid = (to: string, name: string) => {
  return {
    to,
    subject: 'Заявка отправлена!',
    html: `<h2>Заявка отправлена</h2>
    <p>Здравствуйте, ${name}!</p>
    <p>Благодарим вас за то, что решили стать нашим партнером!)</p>
    <p>В ближайшее время наши операторы выйдут с вами на связь.</p>
    <br/>
    <p>С уважением, ort_marvik!</p>`,
  };
};

export const patterNotification = (email: string, name: string) => {
  return {
    to: 'klimovd131@gmail.com',
    subject: 'Уведомление ort_marvik',
    html: `<h2>Пользователь хочет стать партнером</h2>
    <p>Здравствуйте, Дмитрий Сергеевич!</p>
    <p>Пользователь с именем ${name} и е-маилом ${email} хочет стать партнером вашей компании.</p>
    <p>Сервер отработал в штатном режиме. Данные о пользователе сохранены в БД.</p>
    <br/>
    <p>Бэкенд ort_marvik</p>`,
  };
};

export const patternRegister = (to: string, name: string, code: string) => {
  return {
    to,
    subject: 'Регистрация на ort_marvik',
    html: `<h2>Код доступа</h2>
    <p>Здравствуйте, ${name}</p>
    <p>Ваш код:</p>
    <b>${code}</b>
    <p>Пожалуйста, введите его в форму на сайте, чтобы закончить регистрацию!</p>
    <br/>
    <p>С уважением, ort_marvik!</p>`,
  };
};
