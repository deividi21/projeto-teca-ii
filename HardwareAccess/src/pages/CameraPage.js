import React from 'react';
import { StyleSheet, ScrollView, View, Button, KeyboardAvoidingView, ActivityIndicator, Alert, DeviceEventEmitter } from 'react-native';
import { RNSerialport, definitions, actions } from "react-native-serialport";

export default class CameraPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        }
    }

    componentDidMount() {
        DeviceEventEmitter.addListener(
            actions.ON_SERVICE_STARTED,
            this.onServiceStarted,
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_SERVICE_STOPPED,
            this.onServiceStopped,
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_DEVICE_ATTACHED,
            this.onDeviceAttached,
            this
        );
        DeviceEventEmitter.addListener(
            actions.ON_DEVICE_DETACHED,
            this.onDeviceDetached,
            this
        );
        DeviceEventEmitter.addListener(actions.ON_ERROR, this.onError, this);
        DeviceEventEmitter.addListener(actions.ON_CONNECTED, this.onConnected, this);
        DeviceEventEmitter.addListener(
            actions.ON_DISCONNECTED,
            this.onDisconnected,
            this
        );
        DeviceEventEmitter.addListener(actions.ON_READ_DATA, this.onReadData, this);

        //.
        // Set Your Callback Methods in here
        //.
        RNSerialport.setReturnedDataType(definitions.RETURNED_DATA_TYPES.HEXSTRING);
        RNSerialport.setAutoConnect(false);
        RNSerialport.startUsbService();
        //Started usb listener
    }


    componentWillUnmount = async() => {
        DeviceEventEmitter.removeAllListeners();
        const isOpen = await RNSerialport.isOpen();
        if (isOpen) {
          Alert.alert("isOpen", isOpen);
          RNSerialport.disconnect();
        }
        RNSerialport.stopUsbService();
      }
      

    receberCom() {
        getDeviceAsync();
    }

    renderButton() {
        if (this.state.isLoading)
            return <ActivityIndicator size="large" style={styles.loading} />

        return (
            <View>
                <View style={styles.btn}>
                    <Button
                        title="Receber"
                        color="#6542f4"
                        onPress={() => this.receberCom()}
                    />
                </View>
                <View style={styles.btn}>
                    <Button
                        title="Enviar"
                        color="#a08af7"
                    //onPress={() => this.getRegister()}
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
        return (
            <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={styles.container}>
                    {this.renderButton()}
                    {this.renderMessage()}
                </ScrollView>
            </KeyboardAvoidingView>
        )
    }
};

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
