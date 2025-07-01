import { Environment, Sphere } from "./index";
let sphere = new Sphere({
  apiKey: "sk_0649f261327a11b68374d6d6b15bbfb0eb039e505d93b6db85f91678eaa374fd",
  environment: Environment.DEVELOPMENT,
});
sphere.setBearerToken(
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyM2MwNDk4OC1lYjFiLTQwYTMtOTI2NS02YzhhNTYzMzU5NTQiLCJleHRlcm5hbElkIjoiZjE0YjNhNjMtYzY5Ny00MmExLWFlOTMtNTI1OWM1YTBiM2NkIiwicGhvbmVOdW1iZXIiOiIrMjU0Nzk3MTY4NjM2IiwiZW1haWwiOm51bGwsInByb2plY3RJZCI6ImEyZmU3ZDgxLTg3NjUtNGJjYy1hNzVmLTNmYWE2ZTNiNmNmOSIsImFkZHJlc3MiOiIweEFDN0JhMmNhZGViYWVCZDI5YTkzYWJCOEVDOTUwODhlMzIzZTAzYjUiLCJidGNBZGRyZXNzIjoiZHVtbXlidGNhZGRyZXNzMTIzNDU2Nzg5IiwiaWF0IjoxNzQ5NzIxNTk4fQ.icS3w8Z6oJp04F64NI4kaGf4KNsd14ypLV48l8ZOvs8YW2Axm7kecHlcY70yhzlXytHy8LmlAtLiTwtmioeX5Q"
);

const main = async () => {
  try {
    //     const response = await sphere.proxyWallet.signTransaction({
    //         chain: "POLYGON
    //         transactionData: {
    //             to: "0x742d35cc6635c0532925a3b8e6d8d4fDEddC5e1a",
    //             value: "1000000000000000000",
    //             gasLimit: "21000",
    //             gasPrice: "20000000000",
    //             nonce: 42
    //          }}
    //     );
    //     console.log(response);
    // } catch (error) {
    //     console.log(error);
    // }

    // Test listPaymentRequests method
    console.log("Testing listPaymentRequests...");
    const paymentRequestsResponse =
      await sphere.paymentLinks.listPaymentRequests();
    console.log("Payment Requests:", paymentRequestsResponse);

    // Test listSendLinks method
    console.log("Testing listSendLinks...");
    const sendLinksResponse = await sphere.paymentLinks.listSendLinks();
    console.log("Send Links:", sendLinksResponse);

    //get user tokens
    // const response = await sphere.assets.getUserTokens();
    // console.log(response);
  } catch (error) {
    console.log(error);
  }
};

main();
