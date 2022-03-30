import jwt from "jsonwebtoken";

export const generateJsonWebToken = (idPerson: string): string => {
  try {
    return jwt.sign({ idPerson }, process.env.TOKEN_SECRET || "Frave_Social", {
      expiresIn: "24h",
    });
  } catch (err) {
    return "Error al generar el Jwt - Token";
  }
};
