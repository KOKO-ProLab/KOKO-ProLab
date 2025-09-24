import logging
from telegram import Update, Bot, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
import firebase_admin
from firebase_admin import credentials, firestore

# إعدادات البوت والفايبربيز
TELEGRAM_TOKEN = '8403086051:AAFCUdViHB7bydfRIfhBRWujXiS348ykCVk'
ADMIN_TELEGRAM_ID = 5582333658
cred = credentials.Certificate({
  "type": "service_account",
  "project_id": "koko-prolab",
  "private_key_id": "235f6d1d972eae365c77e1593cd2ebe2141bcb86",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDlywnyEmHq+GOS\n74+08WAipYVeQW6aKG1tMT2nxw+qJRpvb6LLbAd9ZGQckR3oQ5t/ZgwQ5TkTZw1J\n1wGvdWEigdozP4uCd/CehEYEYuPtaHyrcsmBiIgLTW6BEBydRo5H9P6dvVZ4EeU2\n4l4hnAAOu2tbys7E5FQfh1VtNIMBvaRK5y/NJMnN0OsMKaJPTGGYHH2ujJ0lftFl\n6jzAY9ywBe/uG/mpHXNHN5NmMJHWHA/FJGWa5jOzD3ZEXeUEJS27I/UT8WQo5e04\nJqKYcUQgX9J9EDrvEXuBlZtJ5Vd/Z2du6ej7Q4LlLTyuD1C6QnIjyKV9O32BCkiK\nUneab5WVAgMBAAECggEAIX/R+Vo4sBp52afW2Vf+3c4nfTAowYx3N13gUR8x52n1\nSp2JrAIZrWv/NDLrmzqP5qinxabFBVEWnNcdRcjk2jT37FStL93wVAuQcX9BHxEG\na7AWNC4FNzCYlXQV18+7Wj4bCD/b5TEmqzOg6WFmmL81zXHpZsaqhNYj3AG1v4Dx\nQZFIY6pQA6VpbnF6Oee6bdxfkNbp0dQXq3Z9tSefyCS6FHfGrJIsrQOXPJ724Q3M\nMJxlVC4R2BM3FDaAHmKG4DuHCGZjNj9/QW3ApDrovvz7VDDAEmYc9YfX36+7otlh\nnK7hgYwhv66pPD0vEpDrUIwJe+dIWZTEL44I+YETGQKBgQD3SE2TFhqj8BUSxmH+\njj2p3vAoUNppfwYMeFeKqpzoe6lrlpd8FTLwMHqRcW2VewE9bUAsvWDeqEGRT0iv\nrURhzdXLxwVtouIUrDBK0E0RQorlYsy1uOXAJ7N1x9hM7MPJunjY9N3J+6S2Ejtl\nJvrW4C+fhVrtYuWJ9dMJIJs8CwKBgQDt5OWM7yEzQ8jkVZCH9Rg/bK23Iq436uig\nEecfT6wiPqMW00LP4gcYhRK+v5hJr5knYUEKtXOX3X4DoFCGE3HHFWFCVDm7jq14\nz1oExWubsQmmfjULQ2cSxCGPQQDJjWnjGjIyQfIX/HCL49d5wbBg3XjsCEFXBWiY\nhcEsJMfY3wKBgQChTKN1Zzy3ZPqKBaeUQTpN3SMwWRUvLXFHnxQTWpkBOPDZQiDM\nCpPwgt7gkmmV0OeNJv9ub5WJh51FaL8UAOSTG43y335V9qKcM3lIw7kRoiMx35GC\nk/ohroPsNxCLlQFdS+paMtedUi0tqpTdtWB320KVPoqCQDlUFWq0EHXR4wKBgEYM\n2tNPLvWLhkJGN9LxBvzWIakFm0t37pwD6Yy8xzEmRJvaBZh1NCWyObzVaiB4hp6j\n8qUWnT0gyZSDxnJUk3JOB1+isYVbFBW46QbyoycrUG4oR7JTXKyX+FHYkETJUV7A\nPfuyk3kgqntm0fJWaHt9e7f1DlhzjUMsT5+SDQ79AoGBANDWAWjHk0nzDFrSjtSE\nySE2K08JyfK4WVAD2BQrvyvwoALH0t8/PNafzRae5SHLmqMfdjfLYhrsF+ZiKNNA\n7h4KMJm5+CNpR2P8v5kMxj+rHCe5IMO0PFVJHWzjCxGpJv5rpNIWASc3AIHbKK2r\nopAL/k89XmzUNZBRxp/Y2Oyf\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@koko-prolab.iam.gserviceaccount.com",
  "client_id": "110771139702893212018",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40koko-prolab.iam.gserviceaccount.com"
})
firebase_admin.initialize_app(cred)
db = firestore.client()

logging.basicConfig(level=logging.INFO)

# أوامر المستخدم
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "مرحباً بك في KOKO ProLab!\nاستخدم /order لطلب خدمة أو /deposit لإيداع رصيد.\nللدعم المباشر استخدم /chat.\nللمسؤولين: /addproduct /orders /users /deposituser"
    )

async def order(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أرسل اسم الخدمة المطلوبة، الرابط أو المعرف، والكمية المطلوبة كل واحدة في رسالة منفصلة.")
    context.user_data['order'] = {}
    return 1

async def order_service(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['order']['service'] = update.message.text
    await update.message.reply_text("أرسل الرابط أو المعرف:")
    return 2

async def order_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['order']['link'] = update.message.text
    await update.message.reply_text("أرسل الكمية المطلوبة:")
    return 3

async def order_quantity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['order']['quantity'] = update.message.text
    user_id = update.effective_user.id
    order = context.user_data['order']
    db.collection('orders').add({
        'telegram_id': user_id,
        'service': order['service'],
        'link': order['link'],
        'quantity': order['quantity'],
        'status': 'بانتظار التنفيذ'
    })
    await update.message.reply_text("تم إرسال الطلب! سيتم مراجعته من الإدارة.")
    return ConversationHandler.END

async def deposit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أرسل المبلغ المطلوب إيداعه:")
    return 1

async def deposit_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    amount = update.message.text
    db.collection('deposits').add({
        'telegram_id': user_id,
        'amount': amount,
        'status': 'بانتظار الإيداع'
    })
    await update.message.reply_text("تم إرسال طلب الإيداع! سيتم مراجعة الطلب من الإدارة.")
    return ConversationHandler.END

async def chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("يرجى كتابة رسالتك وسيتم الرد عليك من الدعم.")
    return 1

async def chat_msg(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message.text
    await context.bot.send_message(chat_id=ADMIN_TELEGRAM_ID, text=f"رسالة دعم من المستخدم {update.effective_user.id}: {msg}")
    await update.message.reply_text("تم إرسال رسالتك للدعم.")
    return ConversationHandler.END

# أوامر الإدارة
async def addproduct(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_TELEGRAM_ID:
        await update.message.reply_text("غير مصرح لك.")
        return
    await update.message.reply_text("أرسل اسم المنتج:")
    return 1

async def addproduct_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['product'] = {'name': update.message.text}
    await update.message.reply_text("أرسل السعر:")
    return 2

async def addproduct_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['product']['price'] = update.message.text
    db.collection('products').add(context.user_data['product'])
    await update.message.reply_text("تم إضافة المنتج بنجاح!")
    return ConversationHandler.END

async def orders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_TELEGRAM_ID:
        await update.message.reply_text("غير مصرح لك.")
        return
    orders = db.collection('orders').stream()
    msg = '\n'.join([f"{o.id}: {o.to_dict()}" for o in orders]) or "لا يوجد طلبات حالياً."
    await update.message.reply_text(msg)

async def users(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_TELEGRAM_ID:
        await update.message.reply_text("غير مصرح لك.")
        return
    users = db.collection('users').stream()
    msg = '\n'.join([f"{u.id}: {u.to_dict()}" for u in users]) or "لا يوجد مستخدمين."
    await update.message.reply_text(msg)

async def deposituser(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_TELEGRAM_ID:
        await update.message.reply_text("غير مصرح لك.")
        return 1
    await update.message.reply_text("أرسل معرف المستخدم:")
    return 1

async def deposituser_id(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['deposituser'] = {'id': update.message.text}
    await update.message.reply_text("أرسل المبلغ:")
    return 2

async def deposituser_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = context.user_data['deposituser']['id']
    amount = int(update.message.text)
    user_ref = db.collection('users').document(user_id)
    user = user_ref.get()
    if user.exists:
        current = user.to_dict().get('balance', 0)
        user_ref.update({'balance': current + amount})
        await update.message.reply_text("تم الإيداع بنجاح.")
    else:
        await update.message.reply_text("المستخدم غير موجود.")
    return ConversationHandler.END

if __name__ == '__main__':
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler('start', start))
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler('order', order)],
        states={
            1: [MessageHandler(filters.TEXT & ~filters.COMMAND, order_service)],
            2: [MessageHandler(filters.TEXT & ~filters.COMMAND, order_link)],
            3: [MessageHandler(filters.TEXT & ~filters.COMMAND, order_quantity)],
        },
        fallbacks=[]
    ))
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler('deposit', deposit)],
        states={
            1: [MessageHandler(filters.TEXT & ~filters.COMMAND, deposit_amount)],
        },
        fallbacks=[]
    ))
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler('chat', chat)],
        states={
            1: [MessageHandler(filters.TEXT & ~filters.COMMAND, chat_msg)],
        },
        fallbacks=[]
    ))
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler('addproduct', addproduct)],
        states={
            1: [MessageHandler(filters.TEXT & ~filters.COMMAND, addproduct_name)],
            2: [MessageHandler(filters.TEXT & ~filters.COMMAND, addproduct_price)],
        },
        fallbacks=[]
    ))
    app.add_handler(CommandHandler('orders', orders))
    app.add_handler(CommandHandler('users', users))
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler('deposituser', deposituser)],
        states={
            1: [MessageHandler(filters.TEXT & ~filters.COMMAND, deposituser_id)],
            2: [MessageHandler(filters.TEXT & ~filters.COMMAND, deposituser_amount)],
        },
        fallbacks=[]
    ))
    app.run_polling()
