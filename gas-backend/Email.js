/**
 * Email Service Controller
 */

const LOGO_BASE64 = "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";

const Email = {
  _send(to, subject, htmlBody) {
    if (!to) return; // Skip if no email provided
    try {
      const logoBlob = Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), 'image/png', 'logo.png');
      MailApp.sendEmail({
        to: to,
        subject: subject,
        body: "กรุณาเปิดอ่านอีเมลนี้ด้วยแอปพลิเคชันที่รองรับ HTML",
        htmlBody: htmlBody,
        inlineImages: {
          logoImage: logoBlob
        }
      });
    } catch (e) {
      console.error("Failed to send email to " + to, e);
      // We catch the error so it doesn't break the main transaction flow
    }
  },

  sendReservationRequestToUser(borrowerEmail, borrowerName, reservation, items) {
    const subject = `ได้รับคำขอจองอุปกรณ์แล้ว (รอการอนุมัติ) - ระบบยืม-คืน`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #f39c12; text-align: center;">ได้รับคำขอจองอุปกรณ์แล้ว</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ระบบได้รับข้อมูลคำขอจองอุปกรณ์ของคุณเรียบร้อยแล้ว ขณะนี้กำลัง <strong>รอแอดมินตรวจสอบและอนุมัติ</strong> โดยมีรายละเอียดดังนี้:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่คาดว่าจะมารับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์ที่จอง:</h3>
        <ul>${itemsListHtml}</ul>

        <p style="color: #e74c3c; margin-top: 20px;">
          <strong>หมายเหตุ:</strong> โปรดรออีเมลยืนยันการอนุมัติจากแอดมิน ก่อนเข้ามารับอุปกรณ์นะครับ
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReservationRequestToAdmin(adminEmail, borrowerName, reservation, items) {
    const subject = `[แจ้งเตือนแอดมิน] มีคำขอจองอุปกรณ์ใหม่จาก ${borrowerName}`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #e67e22; text-align: center;">มีการจองอุปกรณ์ใหม่ (รออนุมัติ)</h2>
        <p>เรียน แอดมิน,</p>
        <p>มีคำขอจองอุปกรณ์ใหม่เข้ามาในระบบจาก <strong>${borrowerName}</strong> โปรดเข้ามาตรวจสอบและทำการอนุมัติ/ปฏิเสธในระบบแอดมิน</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>ผู้จอง:</strong> ${borrowerName}</p>
          <p><strong>วันที่ต้องการรับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>วันที่คืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์:</h3>
        <ul>${itemsListHtml}</ul>
      </div>
    `;
    this._send(adminEmail, subject, htmlBody);
  },

  sendReservationApprovedToUser(borrowerEmail, borrowerName, reservation, items) {
    const subject = `✅ อนุมัติการจองอุปกรณ์แล้ว - ระบบยืม-คืน`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #27ae60; text-align: center;">การจองของคุณได้รับการอนุมัติแล้ว</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>คำขอจองอุปกรณ์ของคุณได้รับการอนุมัติเรียบร้อยแล้ว กรุณามารับอุปกรณ์ตามวันที่ระบุไว้ พร้อมนำบัตรประจำตัวนักศึกษามาด้วยครับ</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่รับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์:</h3>
        <ul>${itemsListHtml}</ul>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReservationRejectedToUser(borrowerEmail, borrowerName, reservation) {
    const subject = `❌ คำขอจองอุปกรณ์ถูกปฏิเสธ - ระบบยืม-คืน`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #c0392b; text-align: center;">คำขอจองอุปกรณ์ของคุณถูกปฏิเสธ</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ทางสโมสรนักศึกษาฯ ต้องขออภัยเป็นอย่างยิ่ง คำขอจองอุปกรณ์ของคุณสำหรับวันที่ ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')} ถึง ${new Date(reservation.returnDate).toLocaleDateString('th-TH')} ไม่สามารถอนุมัติได้</p>
        <p>สาเหตุอาจเกิดจากอุปกรณ์ไม่พร้อมใช้งาน หรืออุปกรณ์มีการชำรุดเสียหาย หากมีข้อสงสัยสามารถติดต่อสโมสรนักศึกษาฯ ได้โดยตรงครับ</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendBorrowEmail(borrowerEmail, borrowerName, transaction, items) {
    const subject = `การยืมอุปกรณ์สำเร็จ - ระบบยืม-คืน ครุศาสตร์อุตสาหกรรม`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.name} (S/N: ${item.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #2980b9; text-align: center;">การยืมอุปกรณ์สำเร็จ</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>คุณได้ทำการยืมอุปกรณ์จากสโมสรนักศึกษาฯ สำเร็จแล้ว โดยมีรายละเอียดดังนี้:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่ยืม:</strong> ${new Date(transaction.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(transaction.dueDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์ที่ยืม:</h3>
        <ul>
          ${itemsListHtml}
        </ul>

        <p style="color: #e74c3c; margin-top: 20px;">
          <strong>คำเตือน:</strong> หากไม่ส่งคืนอุปกรณ์ภายในวันที่กำหนด จะมีค่าปรับวันละ 20 บาท (ไม่รวมเสาร์-อาทิตย์ และวันหยุดราชการ) และหากอุปกรณ์ชำรุดเสียหาย ผู้ยืมต้องรับผิดชอบทุกกรณี
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br/>
          (อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ)
        </p>
      </div>
    `;

    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReturnEmail(borrowerEmail, borrowerName, returnedCount, remainingCount, returnDate, fineAmount = 0) {
    const subject = `การคืนอุปกรณ์ - ระบบยืม-คืน ครุศาสตร์อุตสาหกรรม`;
    
    let statusMessage = remainingCount === 0 
      ? `<p style="color: #27ae60; font-weight: bold;">คุณได้ส่งคืนอุปกรณ์ครบทุกรายการแล้ว ขอบคุณครับ</p>`
      : `<p style="color: #e67e22; font-weight: bold;">⚠️ ยังมีอุปกรณ์ที่ค้างส่งอีกจำนวน ${remainingCount} รายการ กรุณาส่งคืนตามกำหนดด้วยนะครับ</p>`;

    let fineMessage = fineAmount > 0
      ? `<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">
           <p style="color: #c62828; margin: 0; font-weight: bold;">⚠️ แจ้งเตือนค่าปรับล่าช้า</p>
           <p style="color: #d32f2f; margin: 5px 0 0 0;">เนื่องจากคุณส่งคืนอุปกรณ์เลยกำหนด มีค่าปรับชำระเพิ่มเติมจำนวน <strong>${fineAmount} บาท</strong> (คำนวณจากยอด 20 บาท/วัน ไม่รวมวันหยุดเสาร์-อาทิตย์ และวันหยุดราชการ)</p>
           <p style="color: #d32f2f; margin: 5px 0 0 0; font-size: 12px;">กรุณาติดต่อชำระค่าปรับที่สโมสรนักศึกษาฯ</p>
         </div>`
      : '';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #27ae60; text-align: center;">บันทึกการคืนอุปกรณ์</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ระบบได้รับบันทึกการคืนอุปกรณ์ของคุณเรียบร้อยแล้ว:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่คืน:</strong> ${new Date(returnDate).toLocaleDateString('th-TH')}</p>
          <p><strong>จำนวนที่คืนสำเร็จในครั้งนี้:</strong> ${returnedCount} รายการ</p>
        </div>

        ${fineMessage}
        ${statusMessage}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br/>
          (อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ)
        </p>
      </div>
    `;

    this._send(borrowerEmail, subject, htmlBody);
  }
};
