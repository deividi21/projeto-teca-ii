#include <Arduino.h>
#include <esp_camera.h>
#include <esp_int_wdt.h>
#include <esp_task_wdt.h>
#include <esp_timer.h>

#include "fb_gfx.h"
#include "fd_forward.h"
#include "fr_forward.h"

#include "FS.h"
#include "SPIFFS.h"

#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
#define LED_PIN 33   // Status led
#define LED_ON LOW   // - Pin is inverted.
#define LED_OFF HIGH //
#define LAMP_PIN 4   // LED FloodLamp.

#define CAM_ROTATION 0

int myRotation = CAM_ROTATION;

int lampVal = 0;             //default to off
bool autoLamp = false;       // Automatic lamp (auto on while camera running)
int lampChannel = 7;         // a free PWM channel (some channels used by camera)
const int pwmfreq = 50000;   // 50K pwm frequency
const int pwmresolution = 9; // duty cycle bit range
const int pwmMax = pow(2, pwmresolution) - 1;

bool filesystem = true;
bool debugData = false;

typedef struct
{
  size_t len;
} jpg_chunking_t;

// Notification LED
void flashLED(int flashtime)
{
  digitalWrite(LED_PIN, LED_ON);  // On at full power.
  delay(flashtime);               // delay
  digitalWrite(LED_PIN, LED_OFF); // turn Off
}

// Lamp Control
void setLamp(int newVal)
{
  if (newVal != -1)
  {
    // Apply a logarithmic function to the scale.
    int brightness = round((pow(2, (1 + (newVal * 0.02))) - 2) / 6 * pwmMax);
    ledcWrite(lampChannel, brightness);
    Serial.print("Lamp: ");
    Serial.print(newVal);
    Serial.print("%, pwm = ");
    Serial.println(brightness);
  }
}

static size_t jpg_encode_stream(void *arg, size_t index, const void *data, size_t len)
{
  jpg_chunking_t *j = (jpg_chunking_t *)arg;
  if (!index)
  {
    j->len = 0;
  }
  j->len += len;
  return len;
}

void writeJpgCam(fs::FS &fs, const char *path, uint8_t *buf, size_t len)
{
  Serial.printf("Writing file: %s\n", path);

  File file = fs.open(path, FILE_WRITE);
  if (!file)
  {
    Serial.println("Failed to open file for writing");
    return;
  }
  if (file.write(buf, len)) // payload (image), payload length
  {
    Serial.println("File written");
  }
  else
  {
    Serial.println("Write failed");
  }
}

static esp_err_t capture_handler()
{
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;

  Serial.println("Capture Requested");
  if (autoLamp && (lampVal != -1))
    setLamp(lampVal);
  flashLED(75); // little flash of status LED

  int64_t fr_start = esp_timer_get_time();

  fb = esp_camera_fb_get();
  if (!fb)
  {
    Serial.println("Camera capture failed");
    if (autoLamp && (lampVal != -1))
      setLamp(0);
    return ESP_FAIL;
  }

  if (fb->width > 400)
  {
    size_t fb_len = 0;
    if (fb->format == PIXFORMAT_JPEG)
    {
      fb_len = fb->len;
    }
    else
    {
      jpg_chunking_t jchunk = {0};
      res = frame2jpg_cb(fb, 80, jpg_encode_stream, &jchunk) ? ESP_OK : ESP_FAIL;
      fb_len = jchunk.len;
    }

    esp_camera_fb_return(fb);
    int64_t fr_end = esp_timer_get_time();
    
    Serial.printf("Captura JPG: %uB %ums\n", (uint32_t)(fb_len), (uint32_t)((fr_end - fr_start) / 1000));
    
    if (autoLamp && (lampVal != -1))
    {
      setLamp(0);
    }

    // Path where new picture will be saved in SD Card
    String path = "/picture" + String(random(100000000)) + ".jpg";
    Serial.printf("Picture file name: %s\n", path.c_str());

    Serial.println("Dados JPG");
    Serial.println("=======================================");
    fr_start = esp_timer_get_time();
    Serial.write(fb->buf, fb->len);
    fr_end = esp_timer_get_time();
    Serial.println("");
    Serial.println("=======================================");
    Serial.println("Fim");

    Serial.printf("Envio JPG: %uB %ums\n", (uint32_t)(fb_len), (uint32_t)((fr_end - fr_start) / 1000));

    writeJpgCam(SPIFFS, path.c_str(), fb->buf, fb->len);

    return res;
  }
}

void listDir(fs::FS &fs, const char *dirname, uint8_t levels)
{
  Serial.printf("Listing directory: %s\n", dirname);

  File root = fs.open(dirname);
  if (!root)
  {
    Serial.println("Failed to open directory");
    return;
  }
  if (!root.isDirectory())
  {
    Serial.println("Not a directory");
    return;
  }

  File file = root.openNextFile();
  while (file)
  {
    if (file.isDirectory())
    {
      Serial.print("  DIR : ");
      Serial.println(file.name());
      if (levels)
      {
        listDir(fs, file.name(), levels - 1);
      }
    }
    else
    {
      Serial.print("  FILE: ");
      Serial.print(file.name());
      Serial.print("  SIZE: ");
      Serial.println(file.size());
    }
    file = root.openNextFile();
  }
}

void readTxt(fs::FS &fs, const char *path)
{
  Serial.printf("Reading file: %s\n", path);

  File file = fs.open(path);
  if (!file || file.isDirectory())
  {
    Serial.println("Failed to open file for reading");
    return;
  }

  Serial.print("Read from file: ");
  while (file.available())
  {
    Serial.write(file.read());
  }
}

void writeTxt(fs::FS &fs, const char *path, const char *message)
{
  Serial.printf("Writing file: %s\n", path);

  File file = fs.open(path, FILE_WRITE);
  if (!file)
  {
    Serial.println("Failed to open file for writing");
    return;
  }
  if (file.print(message))
  {
    Serial.println("File written");
  }
  else
  {
    Serial.println("Write failed");
  }
}

void appendTxt(fs::FS &fs, const char *path, const char *message)
{
  Serial.printf("Appending to file: %s\n", path);

  File file = fs.open(path, FILE_APPEND);
  if (!file)
  {
    Serial.println("Failed to open file for appending");
    return;
  }
  if (file.print(message))
  {
    Serial.println("Message appended");
  }
  else
  {
    Serial.println("Append failed");
  }
}

void renameFile(fs::FS &fs, const char *path1, const char *path2)
{
  Serial.printf("Renaming file %s to %s\n", path1, path2);
  if (fs.rename(path1, path2))
  {
    Serial.println("File renamed");
  }
  else
  {
    Serial.println("Rename failed");
  }
}

void deleteFile(fs::FS &fs, const char *path)
{
  Serial.printf("Deleting file: %s\n", path);
  if (fs.remove(path))
  {
    Serial.println("File deleted");
  }
  else
  {
    Serial.println("Delete failed");
  }
}

void testFileIO(fs::FS &fs, const char *path)
{
  File file = fs.open(path);
  static uint8_t buf[512];
  size_t len = 0;
  uint32_t start = millis();
  uint32_t end = start;
  if (file && !file.isDirectory())
  {
    len = file.size();
    size_t flen = len;
    start = millis();
    while (len)
    {
      size_t toRead = len;
      if (toRead > 512)
      {
        toRead = 512;
      }
      file.read(buf, toRead);
      len -= toRead;
    }
    end = millis() - start;
    Serial.printf("%u bytes read for %u ms\n", flen, end);
    file.close();
  }
  else
  {
    Serial.println("Failed to open file for reading");
  }

  file = fs.open(path, FILE_WRITE);
  if (!file)
  {
    Serial.println("Failed to open file for writing");
    return;
  }

  size_t i;
  start = millis();
  for (i = 0; i < 2048; i++)
  {
    file.write(buf, 512);
  }
  end = millis() - start;
  Serial.printf("%u bytes written for %u ms\n", 2048 * 512, end);
  file.close();
}

void setup()
{
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  Serial.println("====");
  Serial.println("Inicializando...");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LED_ON);

  // Create camera config structure; and populate with hardware and other defaults
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  //init with highest supported specs to pre-allocate large buffers
  if (psramFound())
  {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  }
  else
  {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK)
  {
    delay(100); // need a delay here or the next serial o/p gets missed
    Serial.printf("\n\nCRITICAL FAILURE: Camera sensor failed to initialise.\n\n");
    Serial.printf("A full (hard, power off/on) reboot will probably be needed to recover from this.\n");
    Serial.printf("Meanwhile; this unit will reboot in 1 minute since these errors sometime clear automatically\n");
    // Reset the I2C bus.. may help when rebooting.
    periph_module_disable(PERIPH_I2C0_MODULE); // try to shut I2C down properly in case that is the problem
    periph_module_disable(PERIPH_I2C1_MODULE);
    periph_module_reset(PERIPH_I2C0_MODULE);
    periph_module_reset(PERIPH_I2C1_MODULE);
    // Start a 60 second watchdog timer
    esp_task_wdt_init(60, true);
    esp_task_wdt_add(NULL);
  }
  else
  {
    Serial.println("Camera init succeeded");

    // Get a reference to the sensor
    sensor_t *s = esp_camera_sensor_get();

    // Dump camera module, warn for unsupported modules.
    switch (s->id.PID)
    {
    case OV9650_PID:
      Serial.println("WARNING: OV9650 camera module is not properly supported, will fallback to OV2640 operation");
      break;
    case OV7725_PID:
      Serial.println("WARNING: OV7725 camera module is not properly supported, will fallback to OV2640 operation");
      break;
    case OV2640_PID:
      Serial.println("OV2640 camera module detected");
      break;
    case OV3660_PID:
      Serial.println("OV3660 camera module detected");
      break;
    default:
      Serial.println("WARNING: Camera module is unknown and not properly supported, will fallback to OV2640 operation");
    }

    // OV3660 initial sensors are flipped vertically and colors are a bit saturated
    if (s->id.PID == OV3660_PID)
    {
      s->set_vflip(s, 1);       //flip it back
      s->set_brightness(s, 1);  //up the blightness just a bit
      s->set_saturation(s, -2); //lower the saturation
    }

    s->set_framesize(s, FRAMESIZE_SVGA); // FRAMESIZE_[QQVGA|HQVGA|QVGA|CIF|VGA|SVGA|XGA|SXGA|UXGA|QXGA(ov3660)]);
    s->set_quality(s, 10);       // 10 to 63
    s->set_brightness(s, 0);      // -2 to 2
    s->set_contrast(s, 0);        // -2 to 2
    s->set_saturation(s, 0);      // -2 to 2
    s->set_special_effect(s, 0);  // 0 to 6 (0 - No Effect, 1 - Negative, 2 - Grayscale, 3 - Red Tint, 4 - Green Tint, 5 - Blue Tint, 6 - Sepia)
    s->set_whitebal(s, 1);        // aka 'awb' in the UI; 0 = disable , 1 = enable
    s->set_awb_gain(s, 1);        // 0 = disable , 1 = enable
    s->set_wb_mode(s, 0);         // 0 to 4 - if awb_gain enabled (0 - Auto, 1 - Sunny, 2 - Cloudy, 3 - Office, 4 - Home)
    s->set_exposure_ctrl(s, 1);   // 0 = disable , 1 = enable
    s->set_aec2(s, 0);            // 0 = disable , 1 = enable
    s->set_ae_level(s, 0);        // -2 to 2
    s->set_aec_value(s, 300);     // 0 to 1200
    s->set_gain_ctrl(s, 1);       // 0 = disable , 1 = enable
    s->set_agc_gain(s, 0);        // 0 to 30
    s->set_gainceiling(s, (gainceiling_t)0);  // 0 to 6
    s->set_bpc(s, 0);             // 0 = disable , 1 = enable
    s->set_wpc(s, 1);             // 0 = disable , 1 = enable
    s->set_raw_gma(s, 1);         // 0 = disable , 1 = enable
    s->set_lenc(s, 1);            // 0 = disable , 1 = enable
    s->set_hmirror(s, 0);         // 0 = disable , 1 = enable
    s->set_vflip(s, 0);           // 0 = disable , 1 = enable
    s->set_dcw(s, 1);             // 0 = disable , 1 = enable
    s->set_colorbar(s, 0);        // 0 = disable , 1 = enable

  }

  //Initialise and set the lamp
  if (lampVal != -1)
  {
    ledcSetup(lampChannel, pwmfreq, pwmresolution); // configure LED PWM channel
    if (autoLamp)
      setLamp(0); // set default value
    else
      setLamp(lampVal);
    ledcAttachPin(LAMP_PIN, lampChannel); // attach the GPIO pin to the channel
  }
  else
  {
    Serial.println("No lamp, or lamp disabled in config");
  }

  if (!SPIFFS.begin(true))
  {
    Serial.println("SPIFFS Mount Failed");
    return;
  }

  listDir(SPIFFS, "/", 0);

  long totalBytes = SPIFFS.totalBytes();
  long usedBytes = SPIFFS.usedBytes();
  long remainingBytes = totalBytes - usedBytes;

  Serial.println("");
  Serial.print("SPIFFS total: ");
  Serial.print(totalBytes);
  Serial.println("");
  Serial.print("SPIFFS utilizado: ");
  Serial.print(usedBytes);
  Serial.println("");
  Serial.print("SPIFFS restante: ");
  Serial.print(remainingBytes);
  Serial.println("");

  if(remainingBytes < 179264)
  {
    SPIFFS.format();
  }

  // Sketch Info
  int sketchSize;
  int sketchSpace;
  String sketchMD5;

  // Used when dumping status; these are slow functions, so just do them once during startup
  sketchSize = ESP.getSketchSize();
  sketchSpace = ESP.getFreeSketchSpace();
  sketchMD5 = ESP.getSketchMD5();

}

void loop()
{

if (Serial.available())
{
  Serial.println("Mensagem recebida");
  String msg = "";
  char cmsg[64] {};
  int c = 0;

  while((Serial.available()) && (c<64))
  {
    cmsg[c] = Serial.read();
    Serial.print(cmsg[c]);
    c++;
  }

  if(strcmp(cmsg, "capturar") == 0)
  {
    Serial.println("Capturando imagem...");
    capture_handler();
  }

}
  
  // put your main code here, to run repeatedly:
}