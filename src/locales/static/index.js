import azAdmin from "./az/admin.json";
import azAuth from "./az/auth.json";
import azCommon from "./az/common.json";
import azExam from "./az/exam.json";
import azPublic from "./az/public.json";
import enAdmin from "./en/admin.json";
import enAuth from "./en/auth.json";
import enCommon from "./en/common.json";
import enExam from "./en/exam.json";
import enPublic from "./en/public.json";
import sourceAdmin from "./source/admin.json";
import sourceAuth from "./source/auth.json";
import sourceCommon from "./source/common.json";
import sourceExam from "./source/exam.json";
import sourcePublic from "./source/public.json";

export const staticAz = {
  ...azCommon,
  ...azPublic,
  ...azAuth,
  ...azAdmin,
  ...azExam,
};

export const staticEn = {
  ...enCommon,
  ...enPublic,
  ...enAuth,
  ...enAdmin,
  ...enExam,
};

export const staticSource = {
  ...sourceCommon,
  ...sourcePublic,
  ...sourceAuth,
  ...sourceAdmin,
  ...sourceExam,
};
