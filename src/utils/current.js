//   const fetchRealTimePrice = async () => {
//     try {
//       const accessToken = await getNewAccessToken(navigation);
//       const url = `http://43.200.211.76:8000/trading/stock_price/?stock_code=${stockInfo.symbol}`;
//       const response = await fetch(url, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const result = await response.json();
//       if (result?.status === "success" && result?.current_price) {
//         setCurrentPrice(result.current_price);
//       } else {
//         console.warn("⚠️ 실시간 가격 불러오기 실패:", result);
//       }
//     } catch (error) {
//       console.error("❌ 실시간 가격 요청 실패:", error);
//     }
//   };
