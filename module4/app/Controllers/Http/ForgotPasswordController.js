const User = use('App/Models/User');
const Mail = use('Mail');
const crypto = require('crypto');

class ForgotPasswordController {
  async store({ request, response }) {
    try {
      const email = request.input('email');
      const user = await User.findByOrFail('email', email);

      user.token = crypto.randomBytes(10).toString('hex');
      user.token_created_at = new Date();

      await user.save();

      await Mail.send(
        ['emails.forgot_password'],
        { email, token: user.token, link: `${request.input('redirect_url')}?token=${user.token}` },
        (message) => {
          message
            .to(user.email)
            .from('diego@email.com', 'Diego')
            .subject('Recuperação de Senha');
        },
      );
    } catch (err) {
      return response.status(err.status).send(err.stack);
    }

    return response.status(200).send();
  }
}

module.exports = ForgotPasswordController;