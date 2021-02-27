import React from 'react';
import {
    ImageBackground,
    StyleSheet,
    Text,
    View,
    Switch,
    Platform,
    KeyboardAvoidingView,
    Button,
    ScrollView,
    Image,
    NativeModules
} from 'react-native';
import { BleManager } from "react-native-ble-plx"
import { Buffer } from "buffer"
import { Dimensions } from 'react-native'


export default class CameraPage extends React.Component {
    constructor() {
        super()
        this.manager = new BleManager()
        this.state = {
            isLoading: false,
            myDevice: '',
            estadoLed: false,
            info: "",
            temperatura: "",
            umidade: "",
        };
        this.deviceprefix = "Device";
        this.devicesuffix_dx = "DX";
        this.sensors = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" //: "TempHu"
        this.keyDevice = 2678;
        this.keySend = 3456;
        this.Aes = NativeModules.Aes;
        
    }

    serviceUUID() {
        return "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
    }

    notifyUUID(num) {
        return num //"6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
    }

    model_dx(model) {
        return this.deviceprefix + model + this.devicesuffix_dx
    }

    info(message) {
        this.setState({ info: message })
    }

    error(message) {
        this.setState({ info: "ERROR: " + message })
    }

    updateValue(key, value) {
        this.setState({ values: { ...this.state.values, [key]: value } })
    }

    componentDidMount() {
        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scanAndConnect();
                subscription.remove();
            }
        }, true);

    }

    async requestPermission() {
        try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this.setState({ permissionStatus: 'granted' });
            } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
                this.setState({ permissionStatus: 'denied' });
            } else {

            }
        } catch (err) {
            console.error(err)
        }
    }

    scanAndConnect() {
        const BLE_DEVICE_NAME = "ESP32 HYPER CAM"

        this.manager.startDeviceScan(null, null, (error, device) => {
            //console.log("Procurando dispositivo...")
            //console.log(device)

            if (error) {
                console.log(error.message)
                return
            }

            this.setState({
                myDevice: device,

            });

            if (device.name == BLE_DEVICE_NAME) {
                console.log("Connecting to device");
                this.manager.stopDeviceScan();

                device.connect()
                    .then((device) => {
                        console.log("Discovering services and characterstics")
                        return device.discoverAllServicesAndCharacteristics()
                    })
                    .then((device) => {
                        console.log("Setting notifications")
                        return this.setupNotifications(device)
                    })
            }
        })
    }

    async setupNotifications(device) {

        const service = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
        const characteristicN = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" //this.notifyUUID(id)

        device.monitorCharacteristicForService(service, characteristicN, (error, characteristic) => {
            if (error) {
                this.error(error.message)
                return
            }
            this.updateValue(characteristic.uuid, characteristic.value)
            console.log(characteristic.value)
            console.log(Buffer.from(characteristic.value, 'base64').toString('ascii'))

            var valuesString = Buffer.from(characteristic.value, 'base64').toString('ascii')

            console.log("Valores recebidos")
            console.log(valuesString)


        })

        console.log("Estou para receber")

    }

    tirarFoto() {

        generateKey = (password, salt, cost, length) => this.Aes.pbkdf2(password, salt, cost, length);

        encryptData = (text, key) => {
            return this.Aes.randomKey(16).then(iv => {
                return this.Aes.encrypt(text, key, iv).then(cipher => ({
                    cipher,
                    iv,
                }))
            })
        }
    
        decryptData = (encryptedData, key) => this.Aes.decrypt(encryptedData.cipher, key, encryptedData.iv)

        generateKey('Teste', 'salt', 5000, 128).then(key => {
            console.log('Key:', key)
            encryptData('Liga o LED', key)
                .then(({ cipher, iv }) => {
                    console.log('Encrypted:', cipher)
    
                    decryptData({ cipher, iv }, key)
                        .then(text => {
                            console.log('Decrypted:', text)
                        })
                        .catch(error => {
                            console.log(error)
                        })
                })
                .catch(error => {
                    console.log(error)
                })
        })


        const device = this.state.myDevice;

        const test = "B";

        //console.log(Buffer.from(test.toString(), 'ascii').toString('base64'));
        this.manager.writeCharacteristicWithResponseForDevice(device.id, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', Buffer.from(test.toString(), 'ascii').toString('base64'))
            .then((characteristic) => {
                console.log(characteristic.value);
                return
            })
            .catch((error) => {
                console.log(error.message)
            })

    }

    aumentaLanterna() {

        const device = this.state.myDevice;

        const test = "+";

        //console.log(Buffer.from(test.toString(), 'ascii').toString('base64'));
        this.manager.writeCharacteristicWithResponseForDevice(device.id, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', Buffer.from(test.toString(), 'ascii').toString('base64'))
            .then((characteristic) => {
                console.log(characteristic.value);
                return
            })
            .catch((error) => {
                console.log(error.message)
            })

    }

    reduzLanterna() {

        const device = this.state.myDevice;

        const test = "-";

        //console.log(Buffer.from(test.toString(), 'ascii').toString('base64'));
        this.manager.writeCharacteristicWithResponseForDevice(device.id, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400002-B5A3-F393-E0A9-E50E24DCCA9E', Buffer.from(test.toString(), 'ascii').toString('base64'))
            .then((characteristic) => {
                console.log(characteristic.value);
                return
            })
            .catch((error) => {
                console.log(error.message)
            })

    }

    renderButton() {
        if (this.state.isLoading)
            return <ActivityIndicator size="large" style={styles.loading} />

        return (
            <View>
                <View style={styles.btn}>

                    <Button
                        title="Tirar Foto"
                        color="#6542f4"
                        onPress={() => this.tirarFoto()}
                    />
                </View>
                <View style={styles.btn}>
                    <Text>Lanterna</Text>
                    <Button
                        title="+"
                        color="#a08af7"
                        onPress={() => this.aumentaLanterna()}
                    />
                    <Button
                        title="-"
                        color="#a08af7"
                        onPress={() => this.reduzLanterna()}
                    />
                </View>
            </View>
        )
    }

    renderMessage() {
        const { message } = this.state;
        if (!message)
            return null;

        Alert.alert(
            "Erro!",
            message.toString(),
            [{
                text: 'OK',
                onPress: () => { this.setState({ message: '' }); }
            }]
        );
    }

    render() {
        const isLoggedIn = this.state.stateLed;
        var temp = this.state.temperature;
        var umi = this.state.humidity;

        return (

            <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={styles.container}>
                    {this.renderButton()}
                    {this.renderMessage()}
                </ScrollView>
            </KeyboardAvoidingView>

        );
    }
}

const styles = StyleSheet.create({
    container: {
        paddingRight: 10,
        paddingLeft: 10,
        backgroundColor: "#dbd5d5"
    },
    input: {
        paddingLeft: 5,
        paddingRight: 5
    },
    btn: {
        flex: 1,
        paddingTop: 20,
        fontSize: 11
    },
    logo: {
        aspectRatio: 1,
        resizeMode: 'center',
        width: 400,
        height: 400
    },
    logoView: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    loading: {
        padding: 2
    }
});
