import React from 'react';
import { StyleSheet, ScrollView, View, Button, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import SerialPortAPI from 'react-native-serial-port-api';


async function example() {
    const serialPort = await SerialPortAPI.open("/dev/ttyS4", { baudRate: 38400 });

    // subscribe received data
    const sub = serialPort.onReceived(buff => {
        console.log(buff.toString('hex').toUpperCase());
    })

    // unsubscribe
    // sub.remove();

    // send data with hex format
    await serialPort.send('00FF');

    // close
    serlialPort.close();
}

export default class CameraPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        }
    }

    componentDidMount() {

    }

    receberCom() {
        Alert.alert("isOpen", "teste");
        example();
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
