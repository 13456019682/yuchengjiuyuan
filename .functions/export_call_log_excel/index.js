const cloud = require('wx-server-sdk');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { data, header, fileName } = event;
    if (!data || !data.length || !header) {
      return {
        isSuccess: false,
        msg: '无有效导出数据'
      };
    }

    // 1. 处理导出数据，映射表头
    const exportData = data.map(item => {
      const row = {};
      header.forEach(({ key, title }) => {
        row[title] = item[key] || '';
      });
      return row;
    });

    // 2. 生成Excel文件
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '通话记录');

    // 3. 保存Excel到云函数临时目录
    const tempFilePath = path.join('/tmp', `${fileName}_${Date.now()}.xlsx`);
    XLSX.writeFile(workbook, tempFilePath);

    // 4. 上传Excel文件到云存储
    const uploadRes = await cloud.uploadFile({
      cloudPath: `excel/export/${fileName}_${Date.now()}.xlsx`,
      fileContent: fs.readFileSync(tempFilePath)
    });

    // 5. 获取云存储文件临时下载链接（有效期1小时）
    const downloadRes = await cloud.getTempFileURL({
      fileList: [uploadRes.fileID]
    });

    return {
      isSuccess: true,
      msg: 'Excel生成并上传成功',
      data: {
        downloadUrl: downloadRes.fileList[0].tempFileURL,
        fileID: uploadRes.fileID
      }
    };
  } catch (err) {
    console.error('Excel导出失败：', err);
    return {
      isSuccess: false,
      msg: 'Excel导出失败',
      error: err.message
    };
  }
};