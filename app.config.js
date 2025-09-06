// export default ({ config }) => {
//     const baseConfig = {
//       ...config,
//       extra: {
//         eas: {
//           projectId: process.env.EAS_PROJECT_ID || "d831fa11-69a9-40eb-a916-ae0d22291e92"
//         }
//       },
//       owner: process.env.EAS_OWNER || "r8ol7z"
//     };
  
//     return baseConfig;
//   };

//   // 일단 계정 정보 기본값 -> 승연


export default ({ config }) => {
  const baseConfig = {
    ...config,
    extra: {
      eas: {
        projectId: "d831fa11-69a9-40eb-a916-ae0d22291e92"
      }
    },
    owner: "r8ol7z"
  };

  return baseConfig;
};