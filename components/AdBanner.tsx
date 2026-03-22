import React from 'react';
import { Platform } from 'react-native';

// AdMob is only available on native platforms
// On web, this component renders nothing
export const AdBanner: React.FC = () => null;

// Note: For native builds, replace this file with the full implementation:
// import React from 'react';
// import { Platform, View } from 'react-native';
// export const AdBanner: React.FC = () => {
//   if (Platform.OS === 'web') return null;
//   try {
//     const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');
//     const BANNER_ID = Platform.select({
//       ios: TestIds.BANNER,
//       android: TestIds.BANNER,
//       default: TestIds.BANNER,
//     });
//     return (
//       <View style={{ alignItems: 'center' }}>
//         <BannerAd
//           unitId={BANNER_ID!}
//           size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
//           requestOptions={{ requestNonPersonalizedAdsOnly: true }}
//         />
//       </View>
//     );
//   } catch {
//     return null;
//   }
// };
