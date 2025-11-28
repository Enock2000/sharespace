import B2 from "backblaze-b2";

const b2 = new B2({
    applicationKeyId: "005b3c970d8861d000000001",
    applicationKey: "K005KyUW59hIEi6hCNFyW2Vldzgf6LE",
});

let authorized = false;

export const getB2Client = async () => {
    if (!authorized) {
        try {
            console.log("[B2] Authorizing with Backblaze...");
            await b2.authorize();
            authorized = true;
            console.log("[B2] Authorization successful");
        } catch (error: any) {
            console.error("[B2] Authorization failed:", error.message);
            console.error("[B2] Error details:", error);
            throw error;
        }
    }
    return b2;
};

export const B2_BUCKET_ID = "db63dc494790cd9898a6011d";
export const B2_BUCKET_NAME = "oraninve";
