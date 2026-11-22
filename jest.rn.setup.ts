// React Native's FormData, as on a phone, installed before any module (axios) captures the global.
// Unit tests only: the e2e runner sends real files with Node's FormData.
globalThis.FormData = jest.requireActual('react-native/Libraries/Network/FormData').default;
