declare module 'express' {
  import * as express from 'express';
  export = express;
}

declare module 'cors' {
  import * as cors from 'cors';
  export = cors;
}

declare module 'jsonwebtoken' {
  import * as jwt from 'jsonwebtoken';
  export = jwt;
}

declare module 'bcryptjs' {
  import * as bcrypt from 'bcryptjs';
  export = bcrypt;
}

declare module 'multer' {
  import * as multer from 'multer';
  export = multer;
}

declare module 'nodemailer' {
  import * as nodemailer from 'nodemailer';
  export = nodemailer;
}

declare module 'pdfkit' {
  import * as pdfkit from 'pdfkit';
  export = pdfkit;
}