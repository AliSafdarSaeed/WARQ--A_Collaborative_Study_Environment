// Common styles for email templates
const styles = {
  container: `
    background-color: #f9f9f9;
    padding: 20px;
    font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
  `,
  content: `
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `,
  header: `
    background-color: #47e584;
    padding: 30px 40px;
    text-align: center;
  `,
  logo: `
    color: #ffffff;
    font-size: 32px;
    font-weight: bold;
    margin: 0;
    text-decoration: none;
  `,
  body: `
    padding: 40px;
    color: #333333;
  `,
  heading: `
    color: #333333;
    font-size: 24px;
    margin: 0 0 20px;
  `,
  paragraph: `
    color: #666666;
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 20px;
  `,
  button: `
    display: inline-block;
    background-color: #47e584;
    color: #ffffff;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: bold;
    margin: 20px 0;
  `,
  footer: `
    padding: 20px 40px;
    background-color: #f5f5f5;
    text-align: center;
    font-size: 14px;
    color: #999999;
  `,
  list: `
    margin: 20px 0;
    padding-left: 20px;
  `,
  listItem: `
    color: #666666;
    font-size: 16px;
    line-height: 1.5;
    margin: 10px 0;
  `,
  highlight: `
    color: #47e584;
    font-weight: bold;
  `
};

export const getWelcomeEmailTemplate = ({ name }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WARQ</title>
</head>
<body style="${styles.container}">
  <div style="${styles.content}">
    <div style="${styles.header}">
      <h1 style="${styles.logo}">WARQ</h1>
    </div>
    
    <div style="${styles.body}">
      <h2 style="${styles.heading}">Welcome to WARQ!</h2>
      <p style="${styles.paragraph}">Hi ${name},</p>
      <p style="${styles.paragraph}">
        We're thrilled to welcome you to WARQ - your new collaborative study environment! 
        Get ready to transform the way you learn and collaborate with fellow students.
      </p>
      
      <h3 style="color: #333; margin: 30px 0 15px;">What you can do with WARQ:</h3>
      <ul style="${styles.list}">
        <li style="${styles.listItem}">📝 Create and share interactive study notes</li>
        <li style="${styles.listItem}">👥 Collaborate in real-time with study groups</li>
        <li style="${styles.listItem}">📚 Upload and organize study materials</li>
        <li style="${styles.listItem}">✅ Create and take practice quizzes</li>
        <li style="${styles.listItem}">💬 Engage in group discussions</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" style="${styles.button}">
          Get Started →
        </a>
      </div>
      
      <p style="${styles.paragraph}">
        Need help getting started? Check out our <a href="{{helpUrl}}" style="color: #47e584; text-decoration: none;">quick start guide</a> 
        or reach out to our support team.
      </p>
    </div>
    
    <div style="${styles.footer}">
      <p style="margin: 0;">
        You're receiving this email because you signed up for WARQ.<br>
        If you didn't create this account, please <a href="{{supportUrl}}" style="color: #47e584; text-decoration: none;">contact support</a>.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const getInvitationEmailTemplate = ({ groupName, inviterName, acceptUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WARQ Group Invitation</title>
</head>
<body style="${styles.container}">
  <div style="${styles.content}">
    <div style="${styles.header}">
      <h1 style="${styles.logo}">WARQ</h1>
    </div>
    
    <div style="${styles.body}">
      <h2 style="${styles.heading}">You've Been Invited!</h2>
      <p style="${styles.paragraph}">
        <span style="${styles.highlight}">${inviterName}</span> has invited you to join 
        <span style="${styles.highlight}">${groupName}</span> on WARQ.
      </p>
      
      <div style="background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px;">What you'll get:</h3>
        <ul style="${styles.list}">
          <li style="${styles.listItem}">Access to shared study materials</li>
          <li style="${styles.listItem}">Real-time collaboration on notes</li>
          <li style="${styles.listItem}">Group discussions and updates</li>
          <li style="${styles.listItem}">Practice quizzes and assessments</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" style="${styles.button}">
          Accept Invitation
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">
        Button not working? Copy and paste this link in your browser:<br>
        <a href="${acceptUrl}" style="color: #47e584; word-break: break-all;">
          ${acceptUrl}
        </a>
      </p>
    </div>
    
    <div style="${styles.footer}">
      <p style="margin: 0;">
        This invitation will expire in 7 days.<br>
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Helper function to replace template variables
export const replaceTemplateVars = (template, variables) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return variables[variable] || match;
  });
}; 