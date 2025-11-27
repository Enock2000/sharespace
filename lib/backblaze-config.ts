import B2 from "backblaze-b2";

const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID || "",
    applicationKey: process.env.B2_APPLICATION_KEY || "",
});

let authorized = false;

export const getB2Client = async () => {
    if (!authorized) {
        await b2.authorize();
        authorized = true;
    }
    return b2;
};

export const B2_BUCKET_ID = process.env.B2_BUCKET_ID || "";
export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || "";
