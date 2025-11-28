import B2 from "backblaze-b2";

const b2 = new B2({
    applicationKeyId: "005b3c970d8861d000000001",
    applicationKey: "K005KyUW59hIEi6hCNFyW2Vldzgf6LE",
});

let authorized = false;

export const getB2Client = async () => {
    if (!authorized) {
        await b2.authorize();
        authorized = true;
    }
    return b2;
};

export const B2_BUCKET_ID = "db63dc494790cd9898a6011d";
export const B2_BUCKET_NAME = "oraninve";
