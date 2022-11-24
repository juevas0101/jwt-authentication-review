import { Request, Response } from "express";
import { BadRequestError } from "../helpers/api-erros";
import { userRepository } from "../repositores/userRepository";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class UserController {
  async create(req: Request, res: Response) {
    const { name, email, password } = req.body;

    console.log(name, email, password);

    const userExist = await userRepository.findOneBy({ email });

    if (userExist) {
      throw new BadRequestError(
        "Este E-mail já está em uso, por favor tente outro!"
      );
    }

    const hashPassword = await bycrypt.hash(password, 10);

    const newUser = userRepository.create({
      name,
      email,
      password: hashPassword,
    });

    await userRepository.save(newUser);

    const { password: _, ...user } = newUser;

    return res.status(201).json(user);
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await userRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestError("E-mail ou senha inválidos!");
    }

    const verifiedPass = await bycrypt.compare(password, user.password);

    if (!verifiedPass) {
      throw new BadRequestError("E-mail ou senha inválidos!");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? "", {
      expiresIn: "1h",
    });

    const { password: _, ...userLogin } = user;

    return res.json({
      user: userLogin,
      token: token,
    });
  }

  async getProfile(req: Request, res: Response) {
    return res.json(req.user);
  }
}
