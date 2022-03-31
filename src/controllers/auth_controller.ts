import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import { SignIn } from "../interfaces/login.interface";
import { connect } from "../database/connection";
import { generateJsonWebToken } from "../helpers/generate_jwt";
import { IVerifyUser } from "../interfaces/iverify.interface";
import { sendEmailVerify } from "../helpers/nodemail";

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password }: SignIn = req.body;

    const conn = await connect();

    // Check is exists Email on database
    const [verifyUserdb] = await conn.query<RowDataPacket[0]>(
      "SELECT email, passwordd, email_verified FROM users WHERE email = ?",
      [email]
    );

    if (verifyUserdb.length == 0) {
      return res.status(401).json({
        ans: false,
        message: "Credentials are not registered",
      });
    }

    const verifyUser: IVerifyUser = verifyUserdb[0];

    // Check Email is Verified
    if (!verifyUser.email_verified) {
      resendCodeEmail(verifyUser.email);
      return res.status(401).json({
        ans: false,
        message: "Please check your email",
      });
    }

    // CheckPassword
    if (!(await bcrypt.compareSync(password, verifyUser.passwordd))) {
      return res.status(401).json({
        ans: false,
        message: "Bad credentials",
      });
    }

    const uidPersondb = await conn.query<RowDataPacket[]>(
      "SELECT person_uid as uid FROM users WHERE email = ?",
      [email]
    );

    const { uid } = uidPersondb[0][0];

    let token = generateJsonWebToken(uid);

    conn.end();

    return res.json({
      ans: true,
      message: "Welcome to Social Media",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      ans: false,
      message: error,
    });
  }
};

export const renweLogin = async (req: Request, res: Response) => {
  try {
    const token = generateJsonWebToken(req.idPerson);

    return res.json({
      ans: true,
      message: "Welcome to Social Media",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      ans: false,
      message: error,
    });
  }
};

const resendCodeEmail = async (email: string): Promise<void> => {
  const conn = await connect();

  var randomNumber = Math.floor(10000 + Math.random() * 90000);

  await conn.query("UPDATE users SET token_temp = ? WHERE email = ?", [
    randomNumber,
    email,
  ]);

  await sendEmailVerify(
    "Verification code",
    email,
    `<h1> Social Media </h1><hr> <b>${randomNumber} </b>`
  );

  conn.end();
};
