export function loadSettings(json, xml, environment) {
  const settings = JSON.parse(json);
  const topic = xml.match(/<publication topic="([^"]+)"/)[1];
  const protocol = xml.match(/<transport protocol="([^"]+)"/)[1];
  return { ...settings, topic, protocol, peerOrigin: environment.PEER_URL, brokerUrl: settings.messaging.url, namespace: settings.messaging.namespace };
}
